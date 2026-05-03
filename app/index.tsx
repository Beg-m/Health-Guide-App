import { View } from "react-native";

/**
 * Root entry: navigation is driven by `app/_layout.tsx` bootstrap so onboarding
 * runs before auth/tabs (avoid Redirect → tabs racing ahead of AsyncStorage).
 */
export default function RootIndex() {
  return <View style={{ flex: 1 }} />;
}
