import { View, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlayer } from "../src/player/store";
import { Display, Heading, Body, CoverArt } from "../src/components/ui";
import { duration } from "../src/theme";

export default function Player() {
  const router = useRouter();
  const { current, isPlaying, toggle, seek, positionMs, durationMs } = usePlayer();

  if (!current) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-ink">
        <Body className="text-white">Nothing playing.</Body>
      </SafeAreaView>
    );
  }

  const progress = durationMs ? Math.min(1, positionMs / durationMs) : 0;

  return (
    <SafeAreaView className="flex-1 bg-ink px-6">
      <Pressable onPress={() => router.back()} className="py-4">
        <Text className="font-body text-white">⌄ Close</Text>
      </Pressable>

      <View className="mt-6 items-center">
        <CoverArt seed={current.id} size={260} rounded="rounded-3xl" label={current.title} />
      </View>

      <View className="mt-8">
        <Display className="text-2xl text-white">{current.title}</Display>
        <Body className="text-muted">{current.artistName} · {current.genre}</Body>
      </View>

      {/* Seek bar */}
      <Pressable
        className="mt-8"
        onPress={(e) => {
          const x = e.nativeEvent.locationX;
          // width is the screen minus px-6 padding (~48). Approximate seek.
          const width = 320;
          seek(Math.max(0, Math.min(1, x / width)) * durationMs);
        }}
      >
        <View className="h-1.5 w-full rounded-full bg-white/10">
          <View className="h-1.5 rounded-full bg-accent" style={{ width: `${progress * 100}%` }} />
        </View>
      </Pressable>
      <View className="mt-2 flex-row justify-between">
        <Body className="text-xs text-muted">{duration(positionMs / 1000)}</Body>
        <Body className="text-xs text-muted">{duration(durationMs / 1000)}</Body>
      </View>

      <View className="mt-10 flex-row items-center justify-center">
        <Pressable
          onPress={toggle}
          className="h-20 w-20 items-center justify-center rounded-full bg-accent active:opacity-80"
        >
          <Text className="text-xl text-ink">{isPlaying ? "❚❚" : "▶"}</Text>
        </Pressable>
      </View>

      {current.progression ? (
        <View className="mt-10 rounded-2xl bg-white/5 p-4">
          <Body className="text-xs uppercase tracking-wide text-muted">Chord progression</Body>
          <Heading className="mt-1 text-accent">{current.progression}</Heading>
          <Body className="mt-1 text-white">{current.bpm} BPM · Key of {current.key}</Body>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
