import { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Stack, usePathname, useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, type User } from "firebase/auth";
import * as Notifications from "expo-notifications";
import { auth } from "@/lib/firebase";
import { migrateLocalRemindersToFirestore } from "@/lib/reminderStorage";
import { getUserProfile } from "@/lib/authStorage";
import { isHealthProfileIncomplete } from "@/lib/healthProfileStorage";
import { resolveOnboardingCompleted } from "@/lib/onboardingStatus";

function isHealthProfilePath(pathname: string): boolean {
  return pathname === "/health-profile" || pathname.startsWith("/health-profile/");
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding";
}

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | "loading">("loading");
  const [bootstrapReady, setBootstrapReady] = useState(false);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push("/(tabs)/reminders" as any);
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setBootstrapReady(false);
      if (firebaseUser?.uid) {
        console.log("[RootLayout] migrateLocalRemindersToFirestore çağrılıyor, uid:", firebaseUser.uid);
        void migrateLocalRemindersToFirestore(firebaseUser.uid).catch((e) =>
          console.warn("[RootLayout] Hatırlatıcı migration FAILED:", e)
        );
      } else {
        console.log("[RootLayout] migrate atlandı: kullanıcı yok veya uid null");
      }
    });
    return unsubscribe;
  }, []);

  /**
   * Tek bootstrap: her auth / rota değişiminde Firestore'dan taze onboarding durumu okunur.
   * Kayıt sonrası onboardingCompleted:false → /onboarding (/(tabs) değil).
   */
  useEffect(() => {
    if (user === "loading") {
      setBootstrapReady(false);
      return;
    }

    let cancelled = false;
    setBootstrapReady(false);

    void (async () => {
      try {
        const onboardingDone = await resolveOnboardingCompleted(user?.uid ?? null);

        if (cancelled) return;

        if (__DEV__) {
          console.log("[RootLayout] onboardingDone:", onboardingDone, "uid:", user?.uid ?? "null", "path:", pathname);
        }

        if (!onboardingDone) {
          if (!isOnboardingPath(pathname)) {
            router.replace("/onboarding");
          }
          return;
        }

        if (!user) {
          if (pathname !== "/auth") {
            router.replace("/auth" as Href);
          }
          return;
        }

        const userDoc = await getUserProfile(user.uid);
        if (cancelled) return;

        const needsHealthProfile = isHealthProfileIncomplete(userDoc?.healthProfile);

        if (needsHealthProfile) {
          if (!isHealthProfilePath(pathname)) {
            router.replace("/health-profile?required=1" as Href);
          }
          return;
        }

        const onEntryPath =
          pathname === "/" ||
          pathname === "/index" ||
          isOnboardingPath(pathname) ||
          pathname === "/auth";

        if (onEntryPath || pathname === "/auth") {
          router.replace("/(tabs)" as Href);
        }
      } catch (e) {
        console.warn("[RootLayout] bootstrap hatası:", e);
        if (!cancelled && !isOnboardingPath(pathname)) {
          router.replace("/onboarding");
        }
      } finally {
        if (!cancelled) {
          setBootstrapReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, pathname, router]);

  const gateLoading = user === "loading" || !bootstrapReady;

  return (
    <>
      <StatusBar style="dark" />
      {gateLoading ? (
        <View style={styles.gate}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : null}
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ presentation: "card", animation: "fade_from_bottom" }} />
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="medicine/[id]" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="health-profile" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen
          name="family"
          options={{
            presentation: "card",
            animation: "slide_from_right",
            headerShown: false,
          }}
        />
        <Stack.Screen name="privacy" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="notification-settings" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="help" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="recipe" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="blog-post" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen
          name="story/new"
          options={{ presentation: "card", animation: "slide_from_right", headerShown: false }}
        />
        <Stack.Screen
          name="user-profile/[uid]"
          options={{
            presentation: "card",
            animation: "slide_from_right",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="user-profile/[uid]/followers"
          options={{
            presentation: "card",
            animation: "slide_from_right",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="user-profile/[uid]/following"
          options={{
            presentation: "card",
            animation: "slide_from_right",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="reels"
          options={{
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  gate: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
});
