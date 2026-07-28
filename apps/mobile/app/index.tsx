import { Redirect } from "expo-router";

// Land on the Discover tab. Browsing is open; actions that need an account
// (generate, post, register rights) prompt for sign-in at the point of use.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
