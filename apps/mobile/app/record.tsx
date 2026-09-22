/**
 * Mobile recording screen.
 *
 * Requests microphone permission, records via expo-av HIGH_QUALITY preset,
 * shows live amplitude metering, and uploads the finished take to the API
 * when the user stops recording.
 */
import { useState, useRef, useCallback } from "react";
import { View, Pressable, Text, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { useSession } from "../src/auth/store";
import { Heading, Body } from "../src/components/ui";

type Phase = "idle" | "recording" | "uploading" | "done";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export default function Record() {
  const router = useRouter();
  const { token } = useSession();

  const [phase, setPhase] = useState<Phase>("idle");
  const [amplitude, setAmplitude] = useState(0); // 0–1 normalised
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const meterInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Microphone access is needed to record audio.");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
      (status) => {
        if (status.isRecording && status.metering !== undefined) {
          // metering is in dBFS (-160 to 0); normalise to 0–1
          const norm = Math.max(0, (status.metering + 60) / 60);
          setAmplitude(norm);
        }
      },
      100, // meter update interval ms
    );

    recordingRef.current = recording;
    setPhase("recording");
  }, []);

  const stopAndUpload = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    setPhase("uploading");
    if (meterInterval.current) clearInterval(meterInterval.current);
    setAmplitude(0);

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recordingRef.current = null;

    if (!uri) {
      Alert.alert("Recording error", "Could not retrieve the recorded file.");
      setPhase("idle");
      return;
    }

    // Build multipart form body.
    const filename = `take_${Date.now()}.m4a`;
    const formData = new FormData();
    // React Native accepts { uri, name, type } as a Blob stand-in.
    formData.append("file", { uri, name: filename, type: "audio/m4a" } as unknown as Blob);

    try {
      const res = await fetch(`${API_BASE}/api/audio/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Do NOT set Content-Type — let the runtime set the multipart boundary.
        },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Upload failed (${res.status})`);
      }
      const { url } = await res.json();
      setUploadedUrl(`${API_BASE}${url}`);
      setPhase("done");
    } catch (err: unknown) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }, [token]);

  const reset = useCallback(() => {
    setPhase("idle");
    setUploadedUrl(null);
    setAmplitude(0);
  }, []);

  const meterWidth = `${Math.round(amplitude * 100)}%`;

  return (
    <SafeAreaView className="flex-1 bg-ink px-6">
      <Pressable onPress={() => router.back()} className="py-4">
        <Text className="font-body text-white">⌄ Close</Text>
      </Pressable>

      <View className="flex-1 items-center justify-center gap-8">
        <Heading className="text-white text-2xl text-center">Record Take</Heading>

        {/* Amplitude meter */}
        <View className="w-full h-3 bg-surface rounded-full overflow-hidden">
          <View
            className="h-full bg-gold rounded-full"
            style={{ width: meterWidth }}
          />
        </View>

        {phase === "idle" && (
          <Pressable
            onPress={startRecording}
            className="w-24 h-24 rounded-full bg-gold items-center justify-center"
          >
            <Text className="text-ink text-3xl">●</Text>
          </Pressable>
        )}

        {phase === "recording" && (
          <>
            <Body className="text-red-400 animate-pulse">Recording…</Body>
            <Pressable
              onPress={stopAndUpload}
              className="w-24 h-24 rounded-full bg-red-500 items-center justify-center"
            >
              <Text className="text-white text-3xl">■</Text>
            </Pressable>
          </>
        )}

        {phase === "uploading" && (
          <>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Body className="text-white">Uploading…</Body>
          </>
        )}

        {phase === "done" && (
          <>
            <Body className="text-green-400 text-center">
              Take saved!{"\n"}
              <Text className="text-zinc-400 text-xs">{uploadedUrl}</Text>
            </Body>
            <Pressable
              onPress={reset}
              className="px-6 py-3 rounded-full bg-gold"
            >
              <Text className="text-ink font-semibold">Record Another</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
