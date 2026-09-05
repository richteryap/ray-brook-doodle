import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

interface MediaItem {
  id: string;
  title: string;
  currentEpisode: number;
  lastWatched: string;
}

export default function LogsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#3b82f6" : "#2563eb";

  const [items, setItems] = useState<MediaItem[]>([]);
  const [sortOrder, setSortOrder] = useState<"Newest First" | "Oldest First">(
    "Newest First",
  );

  const toggleSort = () => {
    setSortOrder((prev) =>
      prev === "Newest First" ? "Oldest First" : "Newest First",
    );
  };

  useEffect(() => {
    async function fetchLogs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching logs:", error);
      } else if (data) {
        const formatted: MediaItem[] = data.map((row) => ({
          id: row.id,
          title: row.show_name,
          currentEpisode: row.episode,
          lastWatched: new Date(row.created_at).toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setItems(formatted);
      }
    }
    fetchLogs();
  }, []);

  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.lastWatched).getTime();
    const timeB = new Date(b.lastWatched).getTime();

    if (sortOrder === "Newest First") {
      return timeB - timeA;
    } else {
      return timeA - timeB;
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="flex-row items-center bg-white dark:bg-slate-800 px-3 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <Feather name="list" size={24} color={isDark ? "#94a3b8" : "#6B7280"} />
        <Text className="text-slate-500 dark:text-slate-400 ml-2 text-md font-medium">
          Logs
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

          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Sort By:{" "}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleSort}
              className="flex-row items-center bg-blue-50 dark:bg-slate-700 px-2 py-1 rounded"
            >
              <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {sortOrder}
              </Text>
              <Feather
                name={sortOrder === "Newest First" ? "arrow-down" : "arrow-up"}
                size={14}
                color={primaryColor}
                className="ml-1"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-y-1">
          {sortedItems.map((item) => (
            <View
              key={item.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
            >
              <View className="flex-row items-center justify-between py-2 px-3 border-b border-slate-200 dark:border-slate-700">
                <View className="flex-1 pr-4">
                  <Text
                    className="text-sm font-bold text-slate-900 dark:text-white"
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(`/title/${item.id}`)}
                  className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-700 items-center justify-center"
                >
                  <Feather
                    name="arrow-up-right"
                    size={16}
                    color={primaryColor}
                  />
                </TouchableOpacity>
              </View>

              <View className="flex-row">
                <View className="flex-1 py-2 px-3 justify-center bg-slate-50/50 dark:bg-slate-800">
                  <Text className="text-sm text-slate-500 dark:text-slate-400">
                    <Text className="font-bold text-blue-600 dark:text-blue-400">
                      Episode {item.currentEpisode}
                    </Text>
                    {" @ "}
                    <Text className="text-md font-bold text-slate-800 dark:text-slate-300">
                      {item.lastWatched}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
