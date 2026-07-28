import { useState } from "react";
import { View, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../src/services/client";
import { useAuth } from "../../src/store/auth";
import { Screen } from "../../src/components/Screen";
import { Display, Heading, Body, Button, Card, Badge } from "../../src/components/ui";
import { CoverArt } from "../../src/components/ui";

export default function Community() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const postsQ = useQuery({ queryKey: ["community"], queryFn: () => api.listCommunity() });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!draft.trim()) return;
    if (!user) return router.push("/auth");
    setBusy(true);
    try {
      await api.createPost(draft.trim(), "post");
      setDraft("");
      qc.invalidateQueries({ queryKey: ["community"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Display className="mb-1 mt-2 text-4xl text-earth-dark">Community</Display>
      <Body className="mb-4">
        All walks of life, one language. Share collabs, events, and what you’re making.
      </Body>

      <Card className="mb-4">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Share something with the community…"
          placeholderTextColor="#8a7a68"
          multiline
          className="min-h-[60px] rounded-xl border border-ochre bg-background px-4 py-3 font-body text-earth-dark"
        />
        <View className="mt-3">
          <Button label={user ? "Post" : "Sign in to post"} onPress={submit} loading={busy} disabled={!draft.trim()} />
        </View>
      </Card>

      {(postsQ.data ?? []).map((post) => (
        <Card key={post.id} className="mb-3">
          <View className="flex-row items-center gap-3">
            <CoverArt seed={post.authorId} size={40} label={post.authorName} />
            <View className="flex-1">
              <Heading className="text-lg">{post.authorName}</Heading>
            </View>
            <Badge label={post.tag} tone="sage" />
          </View>
          <Body className="mt-3 text-earth-dark">{post.body}</Body>
          <View className="mt-3 flex-row gap-4">
            <Body className="text-sm">❤️ {post.likes}</Body>
            <Body className="text-sm">💬 {post.comments}</Body>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
