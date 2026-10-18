import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, View, useColorScheme } from "react-native";
import { supabase } from "../lib/supabase";

export default function Index() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch {
        if (!isMounted) return;
        router.replace("/login");
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900">
      <View className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center overflow-hidden mb-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <Image
          source={require("../../assets/images/logo.png")}
          className="w-10 h-10 object-contain"
        />
      </View>
      <ActivityIndicator size="small" color={isDark ? "#3b82f6" : "#2563eb"} />
    </View>
  );
}
