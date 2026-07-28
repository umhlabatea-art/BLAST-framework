import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../src/services/client";
import { optimizeSeoWithAI } from "../../src/services/aiProvider";
import { useSettings } from "../../src/store/settings";
import { usePlayer } from "../../src/player/store";
import { Screen } from "../../src/components/Screen";
import { Display, Heading, Body, Label, Card, Button, Badge, CoverArt } from "../../src/components/ui";
import { rands, duration } from "../../src/theme";
import type { SeoResult } from "../../src/services/types";

export default function TrackDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const play = usePlayer((s) => s.play);
  const { hasAI, openRouterKey, model } = useSettings();

  const trackQ = useQuery({ queryKey: ["track", id], queryFn: () => api.getTrack(String(id)) });
  const track = trackQ.data;

  const [aiSeo, setAiSeo] = useState<SeoResult | null>(null);
  const [busy, setBusy] = useState(false);

  if (!track) {
    return (
      <Screen>
        <Body className="mt-8 text-center">{trackQ.isLoading ? "Loading…" : "Track not found."}</Body>
      </Screen>
    );
  }

  const seo = aiSeo ?? api.seo(track);
  const live = Boolean(aiSeo);

  async function enhance() {
    if (!track) return;
    if (!hasAI()) {
      router.push("/settings");
      return;
    }
    setBusy(true);
    const result = await optimizeSeoWithAI(track, { key: openRouterKey, model });
    if (result) setAiSeo(result);
    setBusy(false);
  }

  return (
    <Screen>
      {/* AEO: structured metadata for the web export's <head>. No-op on native. */}
      <Head>
        <title>{`${track.title} — ${track.artistName} | Umhlabatea`}</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords.join(", ")} />
        <meta property="og:title" content={`${track.title} — ${track.artistName}`} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:type" content="music.song" />
        <script type="application/ld+json">{JSON.stringify(seo.jsonLd)}</script>
      </Head>

      <View className="mb-5 mt-2 flex-row items-center gap-4">
        <CoverArt seed={track.id} size={88} rounded="rounded-2xl" label={track.title} />
        <View className="flex-1">
          <Display className="text-lg text-ink">{track.title}</Display>
          <Body className="text-muted">{track.artistName}</Body>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            <Badge label={track.genre} tone="neutral" />
            <Badge label={`${track.bpm} BPM`} tone="neutral" />
            <Badge label={track.key} tone="neutral" />
            {track.generated ? <Badge label="AI" tone="accent" /> : null}
          </View>
        </View>
      </View>

      <View className="mb-5 flex-row gap-3">
        <View className="flex-1">
          <Button label="Play" variant="primary" onPress={() => play(track)} />
        </View>
        <View className="flex-1">
          <Button label={`Buy ${rands(track.priceRands)}`} variant="accent" onPress={() => router.push("/subscriptions")} />
        </View>
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Label>SEO / AEO</Label>
        <Badge label={live ? "AI · OpenRouter" : "Offline stub"} tone={live ? "success" : "neutral"} />
      </View>

      <Card className="mb-3">
        <Label>Meta description</Label>
        <Body className="mt-1 text-ink">{seo.description}</Body>
      </Card>

      <Card className="mb-3">
        <Label>Keywords</Label>
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {seo.keywords.map((k) => (
            <Badge key={k} label={k} tone="neutral" />
          ))}
        </View>
      </Card>

      <Card className="mb-3">
        <Label>Answer-engine phrases</Label>
        <View className="mt-1">
          {seo.voiceSearch.map((v) => (
            <Body key={v} className="text-ink">“{v}”</Body>
          ))}
        </View>
      </Card>

      <View className="mb-3">
        <Button
          label={busy ? "Optimising…" : hasAI() ? (live ? "Regenerate with AI" : "Enhance with AI") : "Add OpenRouter key to enhance"}
          variant="outline"
          loading={busy}
          onPress={enhance}
        />
      </View>

      <Button label="Register rights for this track" variant="outline" onPress={() => router.push("/compliance")} />
    </Screen>
  );
}
