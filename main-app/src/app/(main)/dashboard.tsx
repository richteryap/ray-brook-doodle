import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useSync } from "../../lib/SyncContext";

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#3b82f6" : "#2563eb";
  const iconMuted = isDark ? "#94a3b8" : "#6B7280";

  const [username, setUsername] = useState("Loading...");

  const { syncStatus, syncWithCloud } = useSync();

  useFocusEffect(
    useCallback(() => {
      async function loadDashboardData() {
        const cachedUsername = await AsyncStorage.getItem("cached_username");
        if (cachedUsername) {
          setUsername(cachedUsername);
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (data) {
          if (data.username !== cachedUsername) {
            setUsername(data.username);
            await AsyncStorage.setItem("cached_username", data.username);
          }
        } else if (!cachedUsername) {
          setUsername("User");
        }

        const cachedSyncTime = await AsyncStorage.getItem("last_synced");
        if (!cachedSyncTime) {
          syncWithCloud();
        }
      }

      loadDashboardData();
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center overflow-hidden">
            <Image
              source={require("../../../assets/images/logo.png")}
              className="w-full h-full object-contain"
            />
          </View>
          <Text className="text-slate-600 dark:text-slate-300 ml-3 text-lg font-medium">
            {username}
          </Text>
        </View>

        <View className="flex-row items-center gap-x-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={syncWithCloud}
            disabled={syncStatus === "syncing"}
            className="w-8 h-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
          >
            {syncStatus === "syncing" && (
              <Feather name="refresh-cw" size={14} color={iconMuted} />
            )}
            {syncStatus === "synced" && (
              <Ionicons
                name="cloud-done-outline"
                size={16}
                color={primaryColor}
              />
            )}
            {syncStatus === "offline" && (
              <Ionicons
                name="cloud-offline-outline"
                size={16}
                color="#ef4444"
              />
            )}
            {syncStatus === "outdated" && (
              <Ionicons
                name="cloud-download-outline"
                size={16}
                color="#f59e0b"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/account")}
            className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-700 items-center justify-center border border-blue-200 dark:border-slate-600"
          >
            <Feather name="user" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={syncStatus === "syncing"}
            onRefresh={syncWithCloud}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        <View className="flex-row items-center bg-white dark:bg-slate-800 p-3.5 rounded-lg shadow-sm mb-4 border border-slate-200 dark:border-slate-700">
          <Ionicons name="home" size={16} color={iconMuted} />
          <Text className="text-slate-500 dark:text-slate-400 ml-2 text-sm font-medium">
            Dashboard
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4 pb-10">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/currently-watching")}
            className="w-[48%] h-44 bg-[#EF4444] rounded-3xl p-4 justify-between shadow-sm"
          >
            <View className="items-center justify-center flex-1">
              <Ionicons name="play-circle" size={64} color="white" />
            </View>
            <Text className="text-white font-medium text-sm">
              Currently Watching
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/library")}
            className="w-[48%] h-44 bg-[#2DD4BF] rounded-3xl p-4 justify-between shadow-sm"
          >
            <View className="items-center justify-center flex-1">
              <Ionicons name="library" size={56} color="white" />
            </View>
            <Text className="text-white font-medium text-sm">Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/logs")}
            className="w-[48%] h-44 bg-[#3B82F6] rounded-3xl p-4 justify-between shadow-sm"
          >
            <View className="items-center justify-center flex-1">
              <Feather name="list" size={60} color="white" />
            </View>
            <Text className="text-white font-medium text-sm">Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/how-to-use")}
            className="w-[48%] h-44 bg-[#FBBF24] rounded-3xl p-4 justify-between shadow-sm"
          >
            <View className="items-center justify-center flex-1">
              <Ionicons name="help-circle" size={64} color="white" />
            </View>
            <Text className="text-white font-medium text-sm">How to use</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
