import { useMemo, useState } from "react";
import { View, Alert, Platform } from "react-native";
import { api } from "../src/services/client";
import { Screen } from "../src/components/Screen";
import { Display, Heading, Body, Card, Button, Badge } from "../src/components/ui";
import { rands } from "../src/theme";

const AGENT_META: Record<string, { icon: string; name: string; blurb: string }> = {
  crm: { icon: "📈", name: "CRM & Leads", blurb: "Finds your hottest fans and the best time to reach them." },
  seo: { icon: "🔎", name: "SEO / AEO", blurb: "Optimises every track for search and AI assistants." },
  marketing: { icon: "👥", name: "Marketing", blurb: "Builds campaigns, captions, and a posting schedule." },
  legal: { icon: "⚖️", name: "Rights & Legal", blurb: "Prepares SAMRO, CAPASSO & RISA submissions." },
  mixing: { icon: "🎚️", name: "Mix & Master", blurb: "Radio-ready masters in minutes." },
  visual: { icon: "🖼️", name: "4K Visuals", blurb: "Upscales covers and video; print-on-demand merch." },
};

export default function Subscriptions() {
  const tiers = useMemo(() => api.tiers(), []);
  const [chosen, setChosen] = useState<string | null>(null);

  function subscribe(tierName: string) {
    setChosen(tierName);
    const msg = `You're on the ${tierName} path. In live mode this opens secure checkout (Stripe/PayFast).`;
    if (Platform.OS === "web") console.log(msg);
    else Alert.alert("Subscription", msg);
  }

  return (
    <Screen>
      <Display className="mb-1 mt-2 text-4xl text-earth-dark">Choose Your Growth Path</Display>
      <Body className="mb-4">Six embedded AI agents. Artists always keep 80%.</Body>

      {tiers.map((tier) => (
        <Card key={tier.id} className={`mb-4 ${tier.highlighted ? "border-2 border-gold" : ""}`}>
          <View className="flex-row items-center justify-between">
            <Heading className="text-2xl">{tier.name}</Heading>
            {tier.highlighted ? <Badge label="Most Popular" tone="primary" /> : null}
          </View>
          <View className="mt-1 flex-row items-end gap-1">
            <Display className="text-4xl text-burnt-orange">{tier.priceRands === 0 ? "R0" : rands(tier.priceRands)}</Display>
            <Body className="mb-1">{tier.period}</Body>
          </View>

          <View className="mt-3">
            {tier.features.map((f) => (
              <Body key={f} className="py-0.5 text-earth-dark">✓ {f}</Body>
            ))}
          </View>

          {tier.agents.length > 0 ? (
            <View className="mt-4">
              <Body className="mb-2 text-xs uppercase tracking-wide">Included AI agents</Body>
              <View className="flex-row flex-wrap gap-2">
                {tier.agents.map((a) => (
                  <View key={a} className="mb-1 w-full flex-row items-start gap-2 rounded-xl bg-background p-3">
                    <Body className="text-lg">{AGENT_META[a]?.icon}</Body>
                    <View className="flex-1">
                      <Body className="font-bold text-earth-dark">{AGENT_META[a]?.name}</Body>
                      <Body className="text-xs">{AGENT_META[a]?.blurb}</Body>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-4">
            <Button
              label={chosen === tier.name ? "Selected ✓" : tier.priceRands === 0 ? "Get Started" : `Start ${tier.name}`}
              variant={tier.highlighted ? "primary" : "dark"}
              onPress={() => subscribe(tier.name)}
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
