import { Redirect } from "expo-router";

/** @deprecated Use /(tabs)/frigo — kept for deep links */
export default function ScanRedirect() {
  return <Redirect href="/(tabs)/frigo" />;
}
