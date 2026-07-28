/** Music-domain components: artist card, track row, genre pill, stat. */
import { Text, View, Pressable } from "react-native";
import { Link } from "expo-router";
import type { Artist, Track } from "../services/types";
import { compact, duration, rands } from "../theme";
import { CoverArt, Body, Badge } from "./ui";
import { usePlayer } from "../player/store";

export function Stat({ icon, value }: { icon: string; value: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Text>{icon}</Text>
      <Text className="font-body text-sm text-earth-brown">{value}</Text>
    </View>
  );
}

export function GenrePill({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-full border px-4 py-2 ${active ? "border-burnt-orange bg-burnt-orange" : "border-ochre bg-surface"}`}
    >
      <Text className={`font-body text-sm ${active ? "font-bold text-white" : "text-earth-brown"}`}>{label}</Text>
    </Pressable>
  );
}

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <View className="mr-4 w-44">
      <CoverArt seed={artist.id} size={176} rounded="rounded-2xl" label={artist.stageName} />
      <Text className="mt-2 font-display text-xl text-earth-dark" numberOfLines={1}>
        {artist.stageName}
      </Text>
      <Text className="font-body text-xs uppercase tracking-wide text-earth-brown">{artist.genre}</Text>
      <View className="mt-1 flex-row gap-3">
        <Stat icon="📻" value={compact(artist.plays)} />
        <Stat icon="❤️" value={compact(artist.likes)} />
      </View>
    </View>
  );
}

export function TrackRow({ track }: { track: Track }) {
  const play = usePlayer((s) => s.play);
  const current = usePlayer((s) => s.current);
  const isActive = current?.id === track.id;
  return (
    <View className="mb-3 flex-row items-center">
      <Pressable onPress={() => play(track)} className="flex-row items-center">
        <CoverArt seed={track.id} size={56} label={track.title} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className={`font-body font-bold ${isActive ? "text-burnt-orange" : "text-earth-dark"}`} numberOfLines={1}>
              {track.title}
            </Text>
            {track.generated ? <Badge label="AI" tone="accent" /> : null}
          </View>
          <Text className="font-body text-xs text-earth-brown" numberOfLines={1}>
            {track.artistName} · {track.genre} · {duration(track.durationSec)}
          </Text>
        </View>
      </Pressable>
      <View className="ml-auto items-end">
        <Text className="font-body text-sm font-bold text-burnt-orange">{rands(track.priceRands)}</Text>
        <Link href={{ pathname: "/track/[id]", params: { id: track.id } }} className="font-body text-xs text-deep-teal">
          details →
        </Link>
      </View>
    </View>
  );
}

export function LiveSalesTicker({ items }: { items: { id: string; artist: string; track: string; city: string; priceRands: number }[] }) {
  return (
    <View className="rounded-2xl border-2 border-gold bg-earth-dark/95 p-4">
      <View className="mb-2 flex-row items-center gap-2">
        <View className="h-3 w-3 rounded-full bg-vibrant-red" />
        <Text className="font-display text-lg text-gold">Live Sales — Artists Getting Paid</Text>
      </View>
      {items.map((s) => (
        <Text key={s.id} className="border-b border-cream/10 py-1.5 font-body text-sm text-cream">
          <Text className="font-bold text-gold">{s.artist}</Text> sold “{s.track}” in{" "}
          <Text className="text-burnt-orange">{s.city}</Text> for {rands(s.priceRands)}
        </Text>
      ))}
    </View>
  );
}
