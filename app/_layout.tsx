import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, usePathname, useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";

/** Must match onboarding.tsx — only the literal "true" skips onboarding */
const KEY_ONBOARDING_COMPLETED = "onboardingCompleted";
const KEY_IS_LOGGED_IN = "isLoggedIn";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem(
          KEY_ONBOARDING_COMPLETED
        );

        if (__DEV__) {
          console.log("[RootLayout] onboardingCompleted:", onboardingCompleted);
        }

        if (cancelled) return;

        const onboardingDone = onboardingCompleted === "true";

        const onEntryPath =
          pathname === "/" ||
          pathname === "/index" ||
          pathname === "/onboarding" ||
          pathname === "/auth";

        if (!onboardingDone) {
          if (pathname !== "/onboarding") {
            router.replace("/onboarding");
          }
          return;
        }

        const isLoggedIn = await AsyncStorage.getItem(KEY_IS_LOGGED_IN);
        if (cancelled) return;

        if (isLoggedIn !== "true") {
          if (pathname !== "/auth") {
            router.replace("/auth" as Href);
          }
          return;
        }

        if (onEntryPath) {
          router.replace("/(tabs)" as Href);
        }
      } catch {
        /* ignore */
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        initialRouteName="onboarding"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="onboarding"
          options={{
            presentation: "card",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen name="index" />
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
        <Stack.Screen
          name="recipe"
          options={{
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="blog-post"
          options={{
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </>
  );
}
