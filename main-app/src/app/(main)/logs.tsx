import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
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
  lastWatched: string;
  rawDate: string;
}

export default function LogsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#3b82f6" : "#2563eb";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";

  const { logs, syncStatus, syncWithCloud } = useSync();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [sortOrder, setSortOrder] = useState<"Newest First" | "Oldest First">(
    "Newest First",
  );
  
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery]);

  const toggleSort = () => {
    setSortOrder((prev) =>
      prev === "Newest First" ? "Oldest First" : "Newest First",
    );
    setVisibleCount(20);
  };

  useEffect(() => {
    if (logs) {
      const formatted: MediaItem[] = logs.map((row: any) => ({
        id: row.id,
        title: row.show_name,
        currentEpisode: row.episode,
        rawDate: row.created_at,
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
  }, [logs]);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    const timeA = new Date(a.rawDate).getTime();
    const timeB = new Date(b.rawDate).getTime();
    return sortOrder === "Newest First" ? timeB - timeA : timeA - timeB;
  });

  const visibleItems = sortedItems.slice(0, visibleCount);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 px-3 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <View className="flex-row items-center">
          <Feather
            name="list"
            size={24}
            color={isDark ? "#94a3b8" : "#6B7280"}
          />
          <Text className="text-slate-500 dark:text-slate-400 ml-2 text-md font-medium">
            Logs
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

          <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 mb-4 shadow-sm">
            <Feather name="search" size={16} color={iconMuted} />
            <TextInput
              className="flex-1 ml-2 text-sm text-slate-900 dark:text-white"
              placeholder="Search logs..."
              placeholderTextColor={iconMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={16} color={iconMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center justify-between">
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

            <View className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {sortedItems.length} Logs
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-y-1">
          {visibleItems.map((item) => (
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

        {sortedItems.length > 0 && (
          <View className="mt-6 mb-2 items-center">
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Showing {visibleItems.length} of {sortedItems.length} logs
            </Text>
            
            {visibleCount < sortedItems.length && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setVisibleCount((prev) => prev + 20)}
                className="px-6 py-3 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 flex-row items-center"
              >
                <Feather name="chevron-down" size={16} color={primaryColor} />
                <Text className="ml-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                  Load More
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}