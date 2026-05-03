import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows } from "@/constants/theme";
import { AnimatedTabBarButton } from "@/components/AnimatedTabBarButton";

const TAB_ICON_ACTIVE = "#16a34a";
const TAB_ICON_INACTIVE = "#9ca3af";
const TAB_ICON_SIZE = 24;

type IonName = React.ComponentProps<typeof Ionicons>["name"];

function TabBarIonicons({
  name,
  focused,
}: {
  name: IonName;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={name}
      size={TAB_ICON_SIZE}
      color={focused ? TAB_ICON_ACTIVE : TAB_ICON_INACTIVE}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: false,
        tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
        tabBarActiveTintColor: TAB_ICON_ACTIVE,
        tabBarInactiveTintColor: TAB_ICON_INACTIVE,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          paddingHorizontal: 4,
          ...Shadows.tabBarTop,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.12,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          paddingHorizontal: 2,
        },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ focused }) => (
            <TabBarIonicons name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "İlaç Ara",
          tabBarIcon: ({ focused }) => (
            <TabBarIonicons name="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="pharmacy"
        options={{
          title: "Eczane",
          tabBarIcon: ({ focused }) => (
            <TabBarIonicons name="medical" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: "Blog",
          tabBarIcon: ({ focused }) => (
            <TabBarIonicons name="leaf" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "Hatırlatma",
          tabBarIcon: ({ focused }) => (
            <TabBarIonicons name="notifications" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => (
            <TabBarIonicons name="person" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
