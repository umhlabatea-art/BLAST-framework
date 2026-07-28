/** Global mini-player docked above the tab bar; taps through to the full player. */
import { Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { usePlayer } from "../player/store";
import { CoverArt } from "./ui";

export function MiniPlayer() {
  const { current, isPlaying, toggle, positionMs, durationMs } = usePlayer();
  const router = useRouter();
  if (!current) return null;

  const progress = durationMs ? Math.min(1, positionMs / durationMs) : 0;

  return (
    <View className="absolute bottom-0 left-0 right-0">
      <View className="h-0.5 w-full bg-earth-brown/40">
        <View className="h-0.5 bg-gold" style={{ width: `${progress * 100}%` }} />
      </View>
      <Pressable onPress={() => router.push("/player")} className="flex-row items-center gap-3 bg-earth-dark px-4 py-3">
        <CoverArt seed={current.id} size={40} label={current.title} />
        <View className="flex-1">
          <Text className="font-body text-sm font-bold text-cream" numberOfLines={1}>
            {current.title}
          </Text>
          <Text className="font-body text-xs text-ochre" numberOfLines={1}>
            {current.artistName}
          </Text>
        </View>
        <Pressable
          onPress={toggle}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-gold"
        >
          <Text className="text-lg text-earth-dark">{isPlaying ? "❚❚" : "▶"}</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}
