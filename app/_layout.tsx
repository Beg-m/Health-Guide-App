import { useEffect, useState } from "react";
import { Stack, usePathname, useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, type User } from "firebase/auth";
import * as Notifications from "expo-notifications";
import { auth } from "@/lib/firebase";
import { migrateLocalRemindersToFirestore } from "@/lib/reminderStorage";

const KEY_ONBOARDING_COMPLETED = "onboardingCompleted";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | "loading">("loading");

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push("/(tabs)/reminders" as any);
    });
    return () => sub.remove();
  }, []);

  // Firebase Auth state'ini dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // null = çıkış yapılmış, User = giriş yapılmış
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

  // Yönlendirme
  useEffect(() => {
    if (user === "loading") return; // Auth henüz başlamadı, bekle

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem(KEY_ONBOARDING_COMPLETED);

        if (__DEV__) {
          console.log("[RootLayout] onboardingCompleted:", onboardingCompleted);
          console.log("[RootLayout] user:", user?.uid ?? "null");
        }

        if (cancelled) return;

        const onboardingDone = onboardingCompleted === "true";
        const onEntryPath =
          pathname === "/" ||
          pathname === "/index" ||
          pathname === "/onboarding" ||
          pathname === "/auth";

        // 1. Önce onboarding kontrolü
        if (!onboardingDone) {
          if (pathname !== "/onboarding") router.replace("/onboarding");
          return;
        }

        // 2. Onboarding tamam ama giriş yok → auth'a gönder
        if (!user) {
          if (pathname !== "/auth") router.replace("/auth" as Href);
          return;
        }

        // 3. Her şey tamam → ana sayfaya
        if (onEntryPath) {
          router.replace("/(tabs)" as Href);
        }
      } catch {
        /* ignore */
      }
    };

    void bootstrap();
    return () => { cancelled = true; };
  }, [user, pathname, router]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack initialRouteName="onboarding" screenOptions={{ headerShown: false }}>
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