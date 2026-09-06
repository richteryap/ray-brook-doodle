import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSync } from "../../lib/SyncContext";

interface MediaItem {
  id: string;
  title: string;
  currentEpisode: number;
  totalEpisodes: number | null;
  lastWatched: string;
  rawDate: string;
}

export default function CurrentlyWatchingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#3b82f6" : "#2563eb";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";

  const { activeShows, syncStatus, syncWithCloud } = useSync();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [sortOrder, setSortOrder] = useState<"Chronological" | "Alphabetical">(
    "Chronological",
  );

  const toggleSort = () => {
    setSortOrder((prev) =>
      prev === "Chronological" ? "Alphabetical" : "Chronological",
    );
  };

  useEffect(() => {
    if (activeShows) {
      const formatted: MediaItem[] = activeShows.map((row: any) => ({
        id: row.id,
        title: row.show_name,
        currentEpisode: row.latest_episode,
        totalEpisodes: row.total_episodes,
        rawDate: row.updated_at,
        lastWatched: new Date(row.updated_at).toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setItems(formatted);
    }
  }, [activeShows]);

  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.rawDate).getTime();
    const timeB = new Date(b.rawDate).getTime();

    if (sortOrder === "Chronological") {
      return timeB - timeA;
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 px-3 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <View className="flex-row items-center">
          <Feather
            name="play-circle"
            size={24}
            color={isDark ? "white" : "black"}
          />
          <Text className="text-slate-500 dark:text-slate-400 ml-2 text-md font-medium">
            Currently Watching
          </Text>
        </View>

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
            <Ionicons name="cloud-offline-outline" size={16} color="#ef4444" />
          )}
          {syncStatus === "outdated" && (
            <Ionicons name="cloud-download-outline" size={16} color="#f59e0b" />
          )}
        </TouchableOpacity>
      </View>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={syncStatus === "syncing"}
            onRefresh={syncWithCloud}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
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
                name={sortOrder === "Chronological" ? "arrow-down" : "arrow-up"}
                size={14}
                color={primaryColor}
                className="ml-1"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-y-1">
          {sortedItems.map((item) => {
            const isCompleted = item.totalEpisodes
              ? item.currentEpisode >= item.totalEpisodes
              : false;
            return (
              <View
                key={item.id}
                className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
              >
                <View
                  className={`absolute top-0 left-0 px-4 py-0 rounded-br-xl z-10 ${
                    isCompleted ? "bg-emerald-500" : "bg-cyan-500"
                  }`}
                >
                  <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                    {isCompleted ? "Completed" : "Watching"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between pt-3 pb-1 px-3 border-b border-slate-200 dark:border-slate-700">
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

                <View className="flex-1 py-1 px-3 border-r border-slate-200 dark:border-slate-700 justify-center bg-slate-50/50 dark:bg-slate-800">
                  <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Episode {item.currentEpisode}
                    {item.totalEpisodes
                      ? ` out of ${item.totalEpisodes} Total Episodes`
                      : " (Ongoing)"}
                  </Text>
                </View>

                <View className="flex-row">
                  <View className="flex-1 py-2 px-3 justify-center bg-slate-50/50 dark:bg-slate-800">
                    <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Last Watched: {item.lastWatched}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
