import { useMemo, useState } from "react";
import { View, Alert, Platform } from "react-native";
import { api } from "../src/services/client";
import { Screen } from "../src/components/Screen";
import { Display, Heading, Body, Label, Card, Button, Badge } from "../src/components/ui";
import { rands } from "../src/theme";

const AGENT_META: Record<string, { name: string }> = {
  crm: { name: "CRM & leads" },
  seo: { name: "SEO / AEO" },
  marketing: { name: "Marketing" },
  legal: { name: "Rights & legal" },
  mixing: { name: "Mix & master" },
  visual: { name: "4K visuals" },
};

export default function Subscriptions() {
  const tiers = useMemo(() => api.tiers(), []);
  const [chosen, setChosen] = useState<string | null>(null);

  function subscribe(name: string) {
    setChosen(name);
    const msg = `You're on the ${name} plan. In live mode this opens secure checkout (Stripe / PayFast).`;
    if (Platform.OS === "web") console.log(msg);
    else Alert.alert("Plan selected", msg);
  }

  return (
    <Screen>
      <Display className="mb-1 mt-2 text-2xl text-ink">Plans</Display>
      <Body className="mb-5">Three simple plans. Artists always keep 80%.</Body>

      {tiers.map((tier) => (
        <Card key={tier.id} className={`mb-3 ${tier.highlighted ? "border-accent" : ""}`}>
          <View className="flex-row items-center justify-between">
            <Heading className="text-lg">{tier.name}</Heading>
            {tier.highlighted ? <Badge label="Popular" tone="accent" /> : null}
          </View>
          {tier.tagline ? <Body className="mt-0.5">{tier.tagline}</Body> : null}

          <View className="mt-3 flex-row items-baseline gap-1">
            <Display className="text-2xl text-ink">{tier.priceRands === 0 ? "Free" : rands(tier.priceRands)}</Display>
            {tier.priceRands > 0 ? <Body className="text-[12px]">/mo</Body> : null}
          </View>
          {tier.annualRands ? (
            <Body className="text-[11px]">or {rands(tier.annualRands)}/yr · 2 months free</Body>
          ) : null}

          <View className="mt-3 border-t border-line pt-3">
            {tier.features.map((f) => (
              <View key={f} className="flex-row gap-2 py-0.5">
                <Body className="text-ink">·</Body>
                <Body className="flex-1 text-ink">{f}</Body>
              </View>
            ))}
          </View>

          {tier.agents.length > 0 ? (
            <View className="mt-3">
              <Label>AI agents included</Label>
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {tier.agents.map((a) => (
                  <Badge key={a} label={AGENT_META[a]?.name ?? a} tone="neutral" />
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-4">
            <Button
              label={chosen === tier.name ? "Selected" : tier.priceRands === 0 ? "Get started" : `Choose ${tier.name}`}
              variant={tier.highlighted ? "accent" : "primary"}
              onPress={() => subscribe(tier.name)}
            />
          </View>
        </Card>
      ))}

      <Body className="mt-2 text-center text-[11px]">Prices in ZAR · cancel anytime · VAT included</Body>
    </Screen>
  );
}
