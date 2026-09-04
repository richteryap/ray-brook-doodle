import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
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
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-slate-900">How to Use</Text>
    </View>
  );
}
