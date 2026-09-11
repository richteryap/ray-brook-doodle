import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
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
  const { activeShows, syncStatus, syncWithCloud, dropActiveShows } = useSync();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [sortOrder, setSortOrder] = useState<"Chronological" | "Alphabetical">("Chronological");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const isLoadingEmpty = syncStatus === "syncing" && items.length === 0;

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "Chronological" ? "Alphabetical" : "Chronological"));
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

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    const timeA = new Date(a.rawDate).getTime();
    const timeB = new Date(b.rawDate).getTime();
    return sortOrder === "Chronological" ? timeB - timeA : a.title.localeCompare(b.title);
  });
  const handleLongPress = (id: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
    }
  };

  const handlePress = (id: string) => {
    if (isSelectionMode) {
      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setIsSelectionMode(false);
      } else {
        next.add(id);
      }
      setSelectedIds(next);
    } else {
      router.push(`/title/${id}`);
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const confirmDelete = () => {
    Alert.alert(
      "Drop Series",
      `Remove ${selectedIds.size} series from Currently Watching? Watch logs will not be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Drop",
          style: "destructive",
          onPress: async () => {
            if (dropActiveShows) {
              await dropActiveShows(Array.from(selectedIds));
            }
            cancelSelection();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 px-3 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <View className="flex-row items-center">
          <Feather name="play-circle" size={24} color={isDark ? "white" : "black"} />
          <Text className="text-slate-500 dark:text-slate-400 ml-2 text-md font-medium">
            Currently Watching
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={syncWithCloud}
          disabled={syncStatus === "syncing" || isSelectionMode}
          className="w-8 h-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
        >
          {syncStatus === "syncing" && <Feather name="refresh-cw" size={14} color={iconMuted} />}
          {syncStatus === "synced" && <Ionicons name="cloud-done-outline" size={16} color={primaryColor} />}
          {syncStatus === "offline" && <Ionicons name="cloud-offline-outline" size={16} color="#ef4444" />}
          {syncStatus === "outdated" && <Ionicons name="cloud-download-outline" size={16} color="#f59e0b" />}
        </TouchableOpacity>
      </View>

      {isSelectionMode && (
        <View className="px-4 pt-4 pb-2 bg-slate-50 dark:bg-slate-900 z-10">
          <View className="flex-row items-center justify-between bg-blue-50 dark:bg-slate-800 p-2 rounded-lg border border-blue-200 dark:border-slate-600 shadow-sm">
            <TouchableOpacity onPress={cancelSelection} className="px-3 py-1">
              <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400">Cancel</Text>
            </TouchableOpacity>
            
            <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {selectedIds.size} Selected
            </Text>

            <TouchableOpacity onPress={confirmDelete} className="px-3 py-1 bg-red-500 rounded">
              <Text className="text-sm font-bold text-white">Drop</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={syncStatus === "syncing"} onRefresh={syncWithCloud} tintColor={primaryColor} colors={[primaryColor]} />}
      >
        {!isSelectionMode && (
          <View className="pt-4 pb-4">
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/dashboard")} className="flex-row items-center mb-4">
              <Ionicons name="arrow-back" size={18} color={primaryColor} />
              <Text className="ml-1 text-sm font-semibold text-blue-600 dark:text-blue-400">Back</Text>
            </TouchableOpacity>

            <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 mb-4 shadow-sm">
              <Feather name="search" size={16} color={iconMuted} />
              <TextInput
                className="flex-1 ml-2 text-sm text-slate-900 dark:text-white"
                placeholder="Search series..."
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
                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Sort By: </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={toggleSort} className="flex-row items-center bg-blue-50 dark:bg-slate-700 px-2 py-1 rounded">
                  <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">{sortOrder}</Text>
                  <Feather name={sortOrder === "Chronological" ? "arrow-down" : "arrow-up"} size={14} color={primaryColor} className="ml-1" />
                </TouchableOpacity>
              </View>

              <View className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {sortedItems.length} {sortedItems.length === 1 ? 'Series' : 'Series'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className={isSelectionMode ? "gap-y-1 pt-2" : "gap-y-1"}>
          {isLoadingEmpty ? (
            [1, 2, 3, 4].map((key) => (
              <View key={key} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[104px] opacity-60">
                <View className="flex-row items-center justify-between pt-4 pb-1 px-3 border-b border-slate-100 dark:border-slate-700/50 mt-2">
                  <View className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700" />
                </View>
                <View className="py-2 px-3 border-r border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800">
                  <View className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
                  <View className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </View>
              </View>
            ))
          ) : sortedItems.length === 0 ? (
            <View className="items-center justify-center pt-16 pb-8 px-4">
              <View className="w-20 h-20 rounded-full bg-slate-200/50 dark:bg-slate-800 items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                <Feather name={searchQuery ? "search" : "tv"} size={32} color={iconMuted} />
              </View>
              <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2 text-center">
                {searchQuery ? "No results found" : "No Active Shows"}
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
                {searchQuery
                  ? `We couldn't find any shows matching "${searchQuery}".`
                  : "Shows you start tracking from the browser extension will appear here."}
              </Text>
            </View>
          ) : (
            sortedItems.map((item) => {
              const isCompleted = item.totalEpisodes ? item.currentEpisode >= item.totalEpisodes : false;
              const isSelected = selectedIds.has(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onLongPress={() => handleLongPress(item.id)}
                  onPress={() => handlePress(item.id)}
                  className={`relative bg-white dark:bg-slate-800 border ${
                    isSelected ? "border-blue-500 dark:border-blue-400 border-2" : "border-slate-200 dark:border-slate-700"
                  } shadow-sm overflow-hidden flex-row`}
                >
                  {isSelectionMode && (
                    <View className="w-12 items-center justify-center bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                      <View className={`w-5 h-5 rounded border ${isSelected ? "bg-blue-500 border-blue-500" : "border-slate-400"} items-center justify-center`}>
                        {isSelected && <Feather name="check" size={14} color="white" />}
                      </View>
                    </View>
                  )}

                  <View className="flex-1">
                    <View className={`absolute top-0 left-0 px-4 py-0 rounded-br-xl z-10 ${isCompleted ? "bg-emerald-500" : "bg-cyan-500"}`}>
                      <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                        {isCompleted ? "Completed" : "Watching"}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between pt-4 pb-1 px-3 border-b border-slate-200 dark:border-slate-700 mt-2">
                      <View className="flex-1 pr-4">
                        <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={2}>
                          {item.title}
                        </Text>
                      </View>
                      {!isSelectionMode && (
                        <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-700 items-center justify-center">
                          <Feather name="arrow-up-right" size={16} color={primaryColor} />
                        </View>
                      )}
                    </View>

                    <View className="py-1 px-3 border-r border-slate-200 dark:border-slate-700 justify-center bg-slate-50/50 dark:bg-slate-800">
                      <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Episode {item.currentEpisode}
                        {item.totalEpisodes ? ` out of ${item.totalEpisodes} Total Episodes` : " (Ongoing)"}
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
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
