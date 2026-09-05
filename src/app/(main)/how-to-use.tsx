import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function HowToUseScreen() {
  const router = useRouter();

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
    <SafeAreaView className="flex-1 bg-[#ECE8FC]">
      <View className="flex-row items-center bg-white p-3 shadow-sm">
        <Feather name="play-circle" size={16} color="black" />
        <Text className="text-[#6B7280] ml-2 text-sm font-medium">
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
            <Ionicons name="arrow-back" size={18} color="#6D28D9" />
            <Text className="ml-1 text-sm font-semibold text-purple-700">
              Back
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-xl font-bold text-slate-900">
            How to Use coming soon!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
