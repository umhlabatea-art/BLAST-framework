import { View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/store/auth";
import { Screen } from "../../src/components/Screen";
import { Display, Heading, Body, Card, Button, Badge, CoverArt } from "../../src/components/ui";

function Row({ label, href, onPress }: { label: string; href?: string; onPress?: () => void }) {
  const router = useRouter();
  return (
    <Button
      label={label}
      variant="outline"
      onPress={onPress ?? (() => href && router.push(href as never))}
      className="mb-2"
    />
  );
}

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <Screen>
      <Display className="mb-4 mt-2 text-4xl text-earth-dark">Profile</Display>

      {user ? (
        <Card className="mb-4">
          <View className="flex-row items-center gap-4">
            <CoverArt seed={user.email} size={64} label={user.email} />
            <View className="flex-1">
              <Heading className="text-xl" numberOfLines={1}>{user.email}</Heading>
              <View className="mt-1">
                <Badge label={`${user.tier} tier`} tone={user.tier === "free" ? "muted" : "accent"} />
              </View>
            </View>
          </View>
        </Card>
      ) : (
        <Card className="mb-4">
          <Heading className="mb-2 text-xl">Join the movement</Heading>
          <Body className="mb-3">Create an account to generate music, earn, and register your rights.</Body>
          <Button label="Sign in / Register" onPress={() => router.push("/auth")} />
        </Card>
      )}

      <Heading className="mb-3 text-2xl">Manage</Heading>
      <Row label="Subscriptions & AI Agents" href="/subscriptions" />
      <Row label="Rights Hub (SAMRO · CAPASSO · RISA)" href="/compliance" />
      <Row label="Your Library & Earnings" href="/(tabs)/library" />

      {user ? (
        <View className="mt-4">
          <Button label="Log out" variant="dark" onPress={logout} />
        </View>
      ) : null}

      <Body className="mt-8 text-center text-xs">
        Umhlabatea (Pty) Ltd · For the artists, by the artists · Made in South Africa
      </Body>
    </Screen>
  );
}
