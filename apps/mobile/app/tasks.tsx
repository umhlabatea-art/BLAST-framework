import { useState } from "react";
import { View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, isLive } from "../src/services/client";
import { Screen } from "../src/components/Screen";
import { Display, Heading, Body, Card, Button, Badge } from "../src/components/ui";
import type { AgentTask } from "../src/services/types";

const AGENT_NAMES: Record<string, string> = {
  crm: "CRM",
  seo: "SEO / AEO",
  marketing: "Marketing",
  mixing: "Mix & master",
  visual: "Visuals",
  legal: "Rights & legal",
};

export default function Tasks() {
  const qc = useQueryClient();
  const tasksQ = useQuery({ queryKey: ["agentTasks"], queryFn: () => api.listAgentTasks() });
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    try {
      await api.createAgentTask({ title: t, source: "manual" });
      setTitle("");
      qc.invalidateQueries({ queryKey: ["agentTasks"] });
    } finally {
      setBusy(false);
    }
  }

  async function done(task: AgentTask) {
    await api.completeAgentTask(task.id);
    qc.invalidateQueries({ queryKey: ["agentTasks"] });
  }

  const tasks = tasksQ.data ?? [];
  const open = tasks.filter((t) => t.status !== "done");
  const closed = tasks.filter((t) => t.status === "done");

  return (
    <Screen>
      <Display className="mb-1 mt-2 text-2xl text-ink">Agent Tasks</Display>
      <Body className="mb-4">
        Action items handled by your AI agents. Tasks created in the Studio Hub's meeting-minutes
        recorder show up here{isLive ? "" : " once the app points at the live API"}.
      </Body>

      <Card className="mb-4">
        <Heading className="mb-2 text-base">Quick add</Heading>
        <View className="flex-row gap-2">
          <View className="flex-1">
            {/* Reuse the app's text input styling via a bare RN TextInput */}
            <TaskInput value={title} onChangeText={setTitle} onSubmitEditing={add} />
          </View>
          <Button label="Add" variant="accent" className="w-auto px-4" loading={busy} onPress={add} />
        </View>
      </Card>

      {tasksQ.isLoading ? (
        <Body className="py-4">Loading…</Body>
      ) : tasks.length === 0 ? (
        <Card>
          <Body>No tasks yet. Generate meeting minutes in the Studio Hub and turn action items into
            tasks — or add one above.</Body>
        </Card>
      ) : (
        <>
          {open.map((t) => (
            <Card key={t.id} className="mb-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Heading className="text-base" numberOfLines={3}>{t.title}</Heading>
                  {t.detail ? <Body className="mt-1 text-xs" numberOfLines={2}>{t.detail}</Body> : null}
                  <View className="mt-2 flex-row items-center gap-2">
                    <Badge label={AGENT_NAMES[t.agent] ?? t.agent} tone="accent" />
                    <Body className="text-[11px]">· {t.source}</Body>
                  </View>
                </View>
                <Button label="Done" variant="outline" className="w-auto px-3" onPress={() => done(t)} />
              </View>
            </Card>
          ))}

          {closed.length > 0 ? (
            <>
              <Heading className="mb-2 mt-4 text-sm">Completed</Heading>
              {closed.map((t) => (
                <Card key={t.id} className="mb-2 opacity-60">
                  <View className="flex-row items-center justify-between">
                    <Heading className="flex-1 text-sm" numberOfLines={2}>{t.title}</Heading>
                    <Badge label="done" tone="success" />
                  </View>
                </Card>
              ))}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

// Small wrapper so the file stays self-contained; mirrors the app's input styling.
import { TextInput } from "react-native";
import { palette } from "../src/theme";
function TaskInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholder="e.g. Register Ubuntu Rising with SAMRO"
      placeholderTextColor={palette["ink-soft"]}
      style={{
        borderWidth: 1,
        borderColor: palette.line,
        backgroundColor: palette.surface ?? "#fff",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontFamily: "IBMPlexMono_400Regular",
        color: palette.ink,
      }}
    />
  );
}
