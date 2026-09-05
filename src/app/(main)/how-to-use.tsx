import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function HowToUseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#3b82f6" : "#2563eb";

  useEffect(() => {
    async function requireAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
      }
    }
    requireAuth();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="flex-row items-center bg-white dark:bg-slate-800 px-3 py-4 mt-10 border-b mt-10 border-slate-200 dark:border-slate-700 shadow-sm">
        <Ionicons
          name="help-circle"
          size={24}
          color={isDark ? "white" : "black"}
        />
        <Text className="text-slate-500 dark:text-slate-400 ml-2 text-md font-medium">
          How to use
        </Text>
      </View>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="pt-4 pb-4">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/dashboard")}
            className="flex-row items-center mb-4"
          >
            <Ionicons name="arrow-back" size={18} color={primaryColor} />
            <Text className="ml-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
              Back
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center bg-transparent mt-10">
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            How to Use coming soon!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
