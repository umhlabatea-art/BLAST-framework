import { useState } from "react";
import { View, TextInput, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/store/auth";
import { Display, Body, Button } from "../src/components/ui";

export default function Auth() {
  const router = useRouter();
  const { register, login, loading, error } = useAuth();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    try {
      if (mode === "register") await register(email.trim(), password);
      else await login(email.trim(), password);
      router.back();
    } catch {
      // error is surfaced from the store below
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-ink px-6">
      <Pressable onPress={() => router.back()} className="py-4">
        <Text className="font-body text-white">⌄ Close</Text>
      </Pressable>

      <View className="mt-8">
        <Display className="text-2xl text-white">
          umhlaba<Display className="text-2xl text-accent">tea</Display>
        </Display>
        <Body className="mt-2 text-muted">Where artists own their future.</Body>
      </View>

      <View className="mt-10">
        <Body className="mb-1 text-white">Email</Body>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#8a7a68"
          className="mb-4 rounded-xl border border-line bg-white/5 px-4 py-3 font-body text-white"
        />
        <Body className="mb-1 text-white">Password</Body>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
          placeholderTextColor="#8a7a68"
          className="mb-2 rounded-xl border border-line bg-white/5 px-4 py-3 font-body text-white"
        />
        {error ? <Body className="mb-2 text-vibrant-red">{error}</Body> : null}

        <View className="mt-4">
          <Button label={mode === "register" ? "Create account" : "Log in"} onPress={submit} loading={loading} />
        </View>

        <Pressable className="mt-4" onPress={() => setMode(mode === "register" ? "login" : "register")}>
          <Body className="text-center text-muted">
            {mode === "register" ? "Already have an account? Log in" : "New here? Create an account"}
          </Body>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
