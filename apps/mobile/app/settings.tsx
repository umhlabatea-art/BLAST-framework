import { useState } from "react";
import { View, TextInput } from "react-native";
import { useSettings } from "../src/store/settings";
import { Screen } from "../src/components/Screen";
import { Heading, Body, Label, Button, Card, Badge } from "../src/components/ui";

export default function Settings() {
  const { openRouterKey, model, setKey, setModel, save, clear, hasAI } = useSettings();
  const [saved, setSaved] = useState(false);
  const live = hasAI();

  async function onSave() {
    await save();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Screen>
      <View className="mt-2 flex-row items-center gap-2">
        <Heading className="text-lg">AI Provider</Heading>
        <Badge label={live ? "Live · OpenRouter" : "Offline stub"} tone={live ? "success" : "neutral"} />
      </View>
      <Body className="mb-4 mt-1">
        Add an OpenRouter API key to power the AI tasks (SEO/AEO optimisation today; CRM, marketing
        and rights drafting next) with a real model. Without a key, everything runs on the built-in
        offline stubs.
      </Body>

      <Card className="mb-4">
        <Label>OpenRouter API key</Label>
        <TextInput
          value={openRouterKey}
          onChangeText={setKey}
          placeholder="sk-or-v1-…"
          placeholderTextColor="#a8a29e"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          className="mt-2 rounded-xl border border-line bg-background px-4 py-3 font-body text-[13px] text-ink"
        />

        <Label className="mt-4">Model</Label>
        <TextInput
          value={model}
          onChangeText={setModel}
          placeholder="anthropic/claude-3.5-sonnet"
          placeholderTextColor="#a8a29e"
          autoCapitalize="none"
          autoCorrect={false}
          className="mt-2 rounded-xl border border-line bg-background px-4 py-3 font-body text-[13px] text-ink"
        />

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1">
            <Button label={saved ? "Saved ✓" : "Save"} variant="accent" onPress={onSave} />
          </View>
          {openRouterKey ? (
            <View className="flex-1">
              <Button label="Remove key" variant="outline" onPress={clear} />
            </View>
          ) : null}
        </View>
      </Card>

      <Body className="text-[12px]">
        Your key is stored locally on this device only and is sent solely to OpenRouter when running
        an AI task. Get a key at openrouter.ai.
      </Body>
    </Screen>
  );
}
