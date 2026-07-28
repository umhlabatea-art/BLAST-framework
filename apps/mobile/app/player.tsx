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
      <SafeAreaView className="flex-1 items-center justify-center bg-earth-dark">
        <Body className="text-cream">Nothing playing.</Body>
      </SafeAreaView>
    );
  }

  const progress = durationMs ? Math.min(1, positionMs / durationMs) : 0;

  return (
    <SafeAreaView className="flex-1 bg-earth-dark px-6">
      <Pressable onPress={() => router.back()} className="py-4">
        <Text className="font-body text-cream">⌄ Close</Text>
      </Pressable>

      <View className="mt-6 items-center">
        <CoverArt seed={current.id} size={260} rounded="rounded-3xl" label={current.title} />
      </View>

      <View className="mt-8">
        <Display className="text-4xl text-cream">{current.title}</Display>
        <Body className="text-ochre">{current.artistName} · {current.genre}</Body>
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
        <View className="h-1.5 w-full rounded-full bg-earth-brown">
          <View className="h-1.5 rounded-full bg-gold" style={{ width: `${progress * 100}%` }} />
        </View>
      </Pressable>
      <View className="mt-2 flex-row justify-between">
        <Body className="text-xs text-ochre">{duration(positionMs / 1000)}</Body>
        <Body className="text-xs text-ochre">{duration(durationMs / 1000)}</Body>
      </View>

      <View className="mt-10 flex-row items-center justify-center">
        <Pressable
          onPress={toggle}
          className="h-20 w-20 items-center justify-center rounded-full bg-gold active:bg-burnt-orange"
        >
          <Text className="text-3xl text-earth-dark">{isPlaying ? "❚❚" : "▶"}</Text>
        </Pressable>
      </View>

      {current.progression ? (
        <View className="mt-10 rounded-2xl bg-earth-brown/40 p-4">
          <Body className="text-xs uppercase tracking-wide text-ochre">Chord progression</Body>
          <Heading className="mt-1 text-gold">{current.progression}</Heading>
          <Body className="mt-1 text-cream">{current.bpm} BPM · Key of {current.key}</Body>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
