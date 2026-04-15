import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, usePathname, useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/constants/theme";

const KEY_HAS_SEEN_ONBOARDING = "hasSeenOnboarding";
const KEY_IS_LOGGED_IN = "isLoggedIn";
const KEY_TEST_RESET_DONE = "@health_guide_test_reset_done";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // Testing helper: clear storage only on the first app load.
        const resetDone = await AsyncStorage.getItem(KEY_TEST_RESET_DONE);
        if (!resetDone) {
          await AsyncStorage.clear();
          await AsyncStorage.setItem(KEY_TEST_RESET_DONE, "true");
        }

        const [hasSeenOnboarding, isLoggedIn] = await Promise.all([
          AsyncStorage.getItem(KEY_HAS_SEEN_ONBOARDING),
          AsyncStorage.getItem(KEY_IS_LOGGED_IN),
        ]);

        if (cancelled) return;

        if (hasSeenOnboarding !== "true") {
          if (pathname !== "/onboarding") {
            router.replace("/onboarding");
          }
        } else if (isLoggedIn !== "true") {
          if (pathname !== "/auth") {
            router.replace("/auth" as Href);
          }
        } else if (pathname === "/" || pathname === "/onboarding" || pathname === "/auth") {
          router.replace("/(tabs)");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <View style={styles.loader}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="onboarding"
          options={{
            presentation: "card",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="medicine/[id]"
          options={{
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="health-profile"
          options={{
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="notification-settings"
          options={{
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="help"
          options={{
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
});
