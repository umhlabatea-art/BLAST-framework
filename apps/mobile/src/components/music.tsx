/** Music-domain components, styled to the minimalist system. */
import { Text, View, Pressable } from "react-native";
import { Link } from "expo-router";
import type { Artist, Track } from "../services/types";
import { compact, duration, rands } from "../theme";
import { CoverArt, Body, Badge } from "./ui";
import { usePlayer } from "../player/store";

export function Stat({ icon, value }: { icon: string; value: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-[11px]">{icon}</Text>
      <Text className="font-body text-[12px] text-muted">{value}</Text>
    </View>
  );
}

export function GenrePill({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-full border px-3.5 py-1.5 ${active ? "border-ink bg-ink" : "border-line bg-surface"}`}
    >
      <Text className={`font-body text-[12px] ${active ? "text-white" : "text-muted"}`}>{label}</Text>
    </Pressable>
  );
}

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <View className="mr-3 w-36">
      <CoverArt seed={artist.id} size={144} rounded="rounded-2xl" label={artist.stageName} />
      <Text className="mt-2 font-medium text-[13px] text-ink" numberOfLines={1}>
        {artist.stageName}
      </Text>
      <Text className="font-body text-[11px] text-muted">{artist.genre}</Text>
      <View className="mt-1 flex-row gap-3">
        <Stat icon="▶" value={compact(artist.plays)} />
        <Stat icon="♥" value={compact(artist.likes)} />
      </View>
    </View>
  );
}

export function TrackRow({ track }: { track: Track }) {
  const play = usePlayer((s) => s.play);
  const current = usePlayer((s) => s.current);
  const isActive = current?.id === track.id;
  return (
    <Link href={{ pathname: "/track/[id]", params: { id: track.id } }} asChild>
      <Pressable className="mb-1 flex-row items-center rounded-xl px-1 py-2 active:bg-black/[0.03]">
        <Pressable onPress={() => play(track)} hitSlop={8}>
          <CoverArt seed={track.id} size={48} label={track.title} />
        </Pressable>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className={`font-medium text-[13px] ${isActive ? "text-accent" : "text-ink"}`} numberOfLines={1}>
              {track.title}
            </Text>
            {track.generated ? <Badge label="AI" tone="accent" /> : null}
          </View>
          <Text className="font-body text-[11px] text-muted" numberOfLines={1}>
            {track.artistName} · {track.genre} · {duration(track.durationSec)}
          </Text>
        </View>
        <Text className="ml-auto font-medium text-[12px] text-ink">{rands(track.priceRands)}</Text>
      </Pressable>
    </Link>
  );
}

export function LiveSalesTicker({ items }: { items: { id: string; artist: string; track: string; city: string; priceRands: number }[] }) {
  return (
    <View className="rounded-2xl border border-line bg-surface p-4">
      <View className="mb-2 flex-row items-center gap-2">
        <View className="h-1.5 w-1.5 rounded-full bg-accent" />
        <Text className="font-body text-[11px] uppercase tracking-[2px] text-muted">Live · artists getting paid</Text>
      </View>
      {items.slice(0, 3).map((s) => (
        <Text key={s.id} className="py-1 font-body text-[12px] text-ink" numberOfLines={1}>
          <Text className="text-ink">{s.artist}</Text>
          <Text className="text-muted"> — {s.track} · {s.city} · </Text>
          <Text className="text-accent">{rands(s.priceRands)}</Text>
        </Text>
      ))}
    </View>
  );
}
