import { useMemo, useState } from "react";
import { View, ScrollView, TextInput } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ARTISTS, GENRES } from "@umhlabatea/core";
import { api } from "../../src/services/client";
import { Screen } from "../../src/components/Screen";
import { Display, Heading, Body, SectionHeader } from "../../src/components/ui";
import { ArtistCard, TrackRow, GenrePill, LiveSalesTicker } from "../../src/components/music";

export default function Discover() {
  const [genre, setGenre] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const tracksQ = useQuery({ queryKey: ["tracks"], queryFn: () => api.listTracks() });
  const liveSales = useMemo(() => api.liveSales(5), []);

  const tracks = (tracksQ.data ?? []).filter((t) => {
    const matchesGenre = !genre || t.genreId === genre || t.genre.toLowerCase().includes(genre);
    const matchesQ = !q || `${t.title} ${t.artistName}`.toLowerCase().includes(q.toLowerCase());
    return matchesGenre && matchesQ;
  });

  return (
    <Screen>
      <View className="mb-2 mt-2 flex-row items-center justify-between">
        <Display className="text-4xl text-earth-dark">
          umhlaba<Display className="text-4xl text-burnt-orange">tea</Display>
        </Display>
        <Link href="/subscriptions" className="font-body font-bold text-deep-teal">
          Go Pro →
        </Link>
      </View>
      <Body className="mb-4">Where artists own their future · 80% revenue share</Body>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search artists, tracks, genres…"
        placeholderTextColor="#8a7a68"
        className="mb-4 rounded-full border border-ochre bg-surface px-5 py-3 font-body text-earth-dark"
      />

      <LiveSalesTicker items={liveSales} />

      <SectionHeader title="Featured Artists" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 px-1">
        {ARTISTS.map((a) => (
          <ArtistCard key={a.id} artist={a} />
        ))}
      </ScrollView>

      <SectionHeader title="Browse" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <GenrePill label="All" active={!genre} onPress={() => setGenre(null)} />
        {GENRES.map((g) => (
          <GenrePill key={g.id} label={g.name} active={genre === g.id} onPress={() => setGenre(g.id)} />
        ))}
      </ScrollView>

      {tracks.length === 0 ? (
        <Body className="py-6 text-center">No tracks match that filter.</Body>
      ) : (
        tracks.map((t) => <TrackRow key={t.id} track={t} />)
      )}
    </Screen>
  );
}
