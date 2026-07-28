import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RIGHTS_BODIES, COMPLIANCE_STATES } from "@umhlabatea/core";
import { api } from "../src/services/client";
import { useAuth } from "../src/store/auth";
import { Screen } from "../src/components/Screen";
import { Display, Heading, Body, Card, Button, Badge } from "../src/components/ui";
import type { Registration } from "../src/services/types";

const bodies = Object.values(RIGHTS_BODIES);

function StateTrack({ state }: { state: Registration["state"] }) {
  const idx = COMPLIANCE_STATES.indexOf(state);
  return (
    <View className="mt-3 flex-row items-center">
      {COMPLIANCE_STATES.map((s, i) => (
        <View key={s} className="flex-1 flex-row items-center">
          <View className={`h-3 w-3 rounded-full ${i <= idx ? "bg-sage" : "bg-ochre/50"}`} />
          {i < COMPLIANCE_STATES.length - 1 ? (
            <View className={`h-0.5 flex-1 ${i < idx ? "bg-sage" : "bg-ochre/40"}`} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default function Compliance() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();

  const tracksQ = useQuery({ queryKey: ["tracks"], queryFn: () => api.listTracks() });
  const regsQ = useQuery({ queryKey: ["registrations"], queryFn: () => api.listRegistrations() });
  const [busyId, setBusyId] = useState<string | null>(null);

  const firstTrack = tracksQ.data?.[0];

  async function startRegistration(bodyId: string) {
    if (!user) return router.push("/auth");
    if (!firstTrack) return;
    await api.createRegistration(bodyId, firstTrack);
    qc.invalidateQueries({ queryKey: ["registrations"] });
  }

  async function advance(reg: Registration) {
    setBusyId(reg.id);
    try {
      await api.advanceRegistration(reg.id, { artistName: user?.email });
      qc.invalidateQueries({ queryKey: ["registrations"] });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen>
      <Display className="mb-1 mt-2 text-4xl text-earth-dark">Rights Hub</Display>
      <Body className="mb-4">
        The legal agent prepares and tracks your registrations. These bodies have no public API, so
        we ready your submission and keep its status here.
      </Body>

      <Heading className="mb-3 text-2xl">Register with a body</Heading>
      {bodies.map((b) => (
        <Card key={b.id} className="mb-3">
          <View className="flex-row items-center justify-between">
            <Heading className="text-xl">{b.name}</Heading>
            <Button label="Prepare" variant="outline" onPress={() => startRegistration(b.id)} />
          </View>
          <Body className="mt-1 text-sm">{b.right}</Body>
        </Card>
      ))}

      <Heading className="mb-3 mt-6 text-2xl">Your Registrations</Heading>
      {(regsQ.data ?? []).length === 0 ? (
        <Body className="py-4">No registrations yet. Prepare one above for “{firstTrack?.title ?? "your track"}”.</Body>
      ) : (
        (regsQ.data ?? []).map((reg) => (
          <Card key={reg.id} className="mb-3">
            <View className="flex-row items-center justify-between">
              <Heading className="text-lg">{reg.bodyName}</Heading>
              <Badge label={reg.state} tone={reg.state === "registered" ? "sage" : "muted"} />
            </View>
            <Body className="mt-1 text-sm">{reg.trackTitle}</Body>
            <StateTrack state={reg.state} />
            {reg.payload ? (
              <View className="mt-3 rounded-xl bg-background p-3">
                <Body className="text-xs uppercase tracking-wide">Prepared payload</Body>
                <Body className="mt-1 font-body text-xs text-earth-dark">
                  {JSON.stringify(reg.payload)}
                </Body>
              </View>
            ) : null}
            {reg.state !== "registered" ? (
              <View className="mt-3">
                <Button
                  label={busyId === reg.id ? "Working…" : `Advance → ${COMPLIANCE_STATES[COMPLIANCE_STATES.indexOf(reg.state) + 1]}`}
                  onPress={() => advance(reg)}
                  loading={busyId === reg.id}
                />
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
