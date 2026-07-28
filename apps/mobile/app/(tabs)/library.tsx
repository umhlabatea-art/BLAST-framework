import { useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { summarize } from "@umhlabatea/core";
import { api } from "../../src/services/client";
import { Screen } from "../../src/components/Screen";
import { Display, Heading, Body, Card, Button } from "../../src/components/ui";
import { TrackRow } from "../../src/components/music";
import { rands } from "../../src/theme";

function EarningTile({ label, value, tone = "text-burnt-orange" }: { label: string; value: string; tone?: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-surface p-4">
      <Body className="text-xs uppercase tracking-wide">{label}</Body>
      <Display className={`mt-1 text-3xl ${tone}`}>{value}</Display>
    </View>
  );
}

export default function Library() {
  const router = useRouter();
  const tracksQ = useQuery({ queryKey: ["tracks"], queryFn: () => api.listTracks() });
  const mine = (tracksQ.data ?? []).filter((t) => t.generated);
  const affiliates = useMemo(() => api.affiliates(), []);

  // Model earnings as if each generated track sold once, three days ago.
  const threeDaysAgo = Date.now() - 3 * 24 * 3600 * 1000;
  const summary = summarize(mine.map((t) => ({ amountRands: t.priceRands, createdAtMs: threeDaysAgo })));

  return (
    <Screen>
      <Display className="mb-1 mt-2 text-4xl text-earth-dark">Your Library</Display>
      <Body className="mb-4">Everything you’ve created, and what it earns — 80% is yours.</Body>

      <View className="mb-3 flex-row gap-3">
        <EarningTile label="Artist Earnings" value={rands(summary.artistEarningsRands)} />
        <EarningTile label="Paid Out" value={rands(summary.paidOutRands)} tone="text-sage" />
      </View>
      <View className="mb-2 flex-row gap-3">
        <EarningTile label="Pending" value={rands(summary.pendingRands)} tone="text-deep-teal" />
        <EarningTile label="Tracks" value={String(summary.salesCount)} tone="text-earth-dark" />
      </View>

      <Heading className="mb-3 mt-6 text-2xl">Your Tracks</Heading>
      {mine.length === 0 ? (
        <Card>
          <Body className="mb-3">You haven’t generated anything yet. Your first track is one prompt away.</Body>
          <Button label="Open the Generator" onPress={() => router.push("/(tabs)/generate")} />
        </Card>
      ) : (
        mine.map((t) => <TrackRow key={t.id} track={t} />)
      )}

      <Heading className="mb-3 mt-6 text-2xl">Revenue Pipelines</Heading>
      {affiliates.map((p) => (
        <Card key={p.id} className="mb-3">
          <View className="flex-row items-center justify-between">
            <Heading className="text-lg">{p.name}</Heading>
            <Body className="font-bold text-burnt-orange">{Math.round(p.commission * 100)}%</Body>
          </View>
          <Body className="mt-1 text-sm">{p.description} · via {p.partner}</Body>
        </Card>
      ))}
    </Screen>
  );
}
