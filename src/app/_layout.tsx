import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import "../global.css";
import { SyncProvider } from "../lib/SyncContext";

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await AsyncStorage.getItem("app_theme");
      if (
        savedTheme === "dark" ||
        savedTheme === "light" ||
        savedTheme === "system"
      ) {
        setColorScheme(savedTheme);
      } else {
        setColorScheme("system");
      }
    }
    loadTheme();
  }, []);

  return (
    <SyncProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SyncProvider>
  );
}
