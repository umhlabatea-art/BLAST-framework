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
    <View className="absolute bottom-0 left-0 right-0 border-t border-line bg-surface">
      <View className="h-0.5 w-full bg-line">
        <View className="h-0.5 bg-accent" style={{ width: `${progress * 100}%` }} />
      </View>
      <Pressable onPress={() => router.push("/player")} className="flex-row items-center gap-3 px-4 py-2.5">
        <CoverArt seed={current.id} size={38} label={current.title} />
        <View className="flex-1">
          <Text className="font-medium text-[13px] text-ink" numberOfLines={1}>
            {current.title}
          </Text>
          <Text className="font-body text-[11px] text-muted" numberOfLines={1}>
            {current.artistName}
          </Text>
        </View>
        <Pressable onPress={toggle} hitSlop={12} className="h-9 w-9 items-center justify-center rounded-full bg-ink">
          <Text className="text-[13px] text-white">{isPlaying ? "❚❚" : "▶"}</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}
