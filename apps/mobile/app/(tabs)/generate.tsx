import { useState } from "react";
import { View, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { GENRES } from "@umhlabatea/core";
import { api } from "../../src/services/client";
import { useAuth } from "../../src/store/auth";
import { usePlayer } from "../../src/player/store";
import { Screen } from "../../src/components/Screen";
import { Display, Heading, Body, Button, Card, Badge } from "../../src/components/ui";
import { GenrePill, TrackRow } from "../../src/components/music";
import type { Track } from "../../src/services/types";

const PROMPT_IDEAS = [
  "Deep amapiano log drum groove at sunset",
  "Soulful afrobeat with call-and-response vocals",
  "Jazzy neo-soul, warm Rhodes chords",
  "Township house, rolling bassline",
];

export default function Generate() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const play = usePlayer((s) => s.play);

  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState(GENRES[0].id);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [result, setResult] = useState<Track | null>(null);

  async function onGenerate() {
    if (!prompt.trim()) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const track = await api.generate(prompt.trim(), {
        genre,
        onProgress: (p) => setStep(p.step),
      });
      setResult(track);
      play(track);
    } finally {
      setBusy(false);
      setStep(null);
    }
  }

  return (
    <Screen>
      <View className="mb-2 mt-2 flex-row items-center gap-2">
        <Display className="text-2xl text-ink">Generate</Display>
        <Badge label="AI" tone="accent" />
      </View>
      <Body className="mb-4">
        Describe the sound. Our AI composer builds a track — you own it, and the SEO/rights agents
        prep it for release.
      </Body>

      <Card>
        <Heading className="mb-2 text-xl">Your prompt</Heading>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g. deep amapiano with a soulful piano hook"
          placeholderTextColor="#8a7a68"
          multiline
          className="min-h-[80px] rounded-xl border border-line bg-background px-4 py-3 font-body text-ink"
        />

        <Body className="mb-2 mt-4 font-bold">Genre</Body>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {GENRES.map((g) => (
            <GenrePill key={g.id} label={g.name} active={genre === g.id} onPress={() => setGenre(g.id)} />
          ))}
        </ScrollView>

        <View className="mt-4">
          <Button
            label={busy ? (step ? `${step}…` : "Generating…") : "Generate Track"}
            onPress={onGenerate}
            loading={busy}
            disabled={!prompt.trim()}
          />
        </View>
      </Card>

      {!result && !busy ? (
        <>
          <Body className="mb-2 mt-6 font-bold">Need a spark?</Body>
          {PROMPT_IDEAS.map((idea) => (
            <View key={idea} className="mb-2">
              <Button label={idea} variant="outline" onPress={() => setPrompt(idea)} />
            </View>
          ))}
        </>
      ) : null}

      {result ? (
        <View className="mt-6">
          <Heading className="mb-3 text-2xl">Fresh from the studio</Heading>
          <Card>
            <TrackRow track={result} />
            <View className="mt-2 flex-row flex-wrap gap-2">
              <Badge label={`${result.bpm} BPM`} tone="success" />
              <Badge label={result.key} tone="neutral" />
              {result.progression ? <Badge label={result.progression} tone="accent" /> : null}
            </View>
            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <Button label="View & Optimize" variant="primary" onPress={() => router.push({ pathname: "/track/[id]", params: { id: result.id } })} />
              </View>
            </View>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
