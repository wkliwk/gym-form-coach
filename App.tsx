import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TrainStackParamList, TabParamList } from "./src/navigation";
import HomeScreen from "./src/screens/Home";
import Session from "./src/screens/Session";
import SummaryScreen from "./src/screens/Summary";
import HistoryScreen from "./src/screens/History";
import OnboardingScreen, { ONBOARDING_KEY } from "./src/screens/Onboarding";

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: "#00E5FF",
    background: "#0a0a0f",
    card: "#0a0a0f",
    text: "#ffffff",
    border: "#2a2a3a",
    notification: "#00E5FF",
  },
};

const Stack = createNativeStackNavigator<TrainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TrainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0a0a0f" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Session" component={Session} />
      <Stack.Screen name="Summary" component={SummaryScreen} />
    </Stack.Navigator>
  );
}

function TrainIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 20, color }}>🏋️</Text>;
}

function HistoryIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 20, color }}>📊</Text>;
}

function MainApp() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0a0a0f",
            borderTopColor: "#2a2a3a",
          },
          tabBarActiveTintColor: "#00E5FF",
          tabBarInactiveTintColor: "#ffffff50",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tab.Screen
          name="Train"
          component={TrainStack}
          options={{ tabBarIcon: TrainIcon }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ tabBarIcon: HistoryIcon }}
        />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

type AppState = "loading" | "onboarding" | "main";

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (value === "true") {
          setAppState("main");
        } else {
          setAppState("onboarding");
        }
      } catch {
        // If storage read fails, skip onboarding to avoid blocking the user
        setAppState("main");
      }
    }
    checkOnboarding();
  }, []);

  if (appState === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0f" }} />
    );
  }

  if (appState === "onboarding") {
    return (
      <OnboardingScreen onComplete={() => setAppState("main")} />
    );
  }

  return <MainApp />;
}
