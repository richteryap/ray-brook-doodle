import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import {
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSync } from "../../lib/SyncContext";

interface LibraryItem {
  id: string;
  title: string;
  totalEpisodes: number;
}

export default function LibraryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#3b82f6" : "#2563eb";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";
  const { libraryShows, syncStatus, syncWithCloud } = useSync();
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    if (libraryShows) {
      const formatted: LibraryItem[] = libraryShows.map((row: any) => ({
        id: row.id,
        title: row.show_name,
        totalEpisodes: row.total_episodes || 0,
      }));
      setItems(formatted);
    }
  }, [libraryShows]);

  const groupedData = useMemo(() => {
    const filtered = items.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

    const grouped = sorted.reduce((acc: { title: string; data: LibraryItem[] }[], item) => {
      let firstLetter = item.title.charAt(0).toUpperCase();
      if (!/[A-Z]/.test(firstLetter)) firstLetter = "#";

      const section = acc.find((s) => s.title === firstLetter);
      if (section) {
        section.data.push(item);
      } else {
        acc.push({ title: firstLetter, data: [item] });
      }
      return acc;
    }, []);

    return grouped;
  }, [items, searchQuery]);

  const isLoadingEmpty = syncStatus === "syncing" && items.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 px-3 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <View className="flex-row items-center">
          <Ionicons name="library" size={24} color={isDark ? "white" : "black"} />
          <Text className="text-slate-500 dark:text-slate-400 ml-2 text-md font-medium">
            Library
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={syncWithCloud}
          disabled={syncStatus === "syncing"}
          className="w-8 h-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
        >
          {syncStatus === "syncing" && <Feather name="refresh-cw" size={14} color={iconMuted} />}
          {syncStatus === "synced" && <Ionicons name="cloud-done-outline" size={16} color={primaryColor} />}
          {syncStatus === "offline" && <Ionicons name="cloud-offline-outline" size={16} color="#ef4444" />}
          {syncStatus === "outdated" && <Ionicons name="cloud-download-outline" size={16} color="#f59e0b" />}
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4">
        <View className="pt-4 pb-2">
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/dashboard")} className="flex-row items-center mb-4">
            <Ionicons name="arrow-back" size={18} color={primaryColor} />
            <Text className="ml-1 text-sm font-semibold text-blue-600 dark:text-blue-400">Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 mb-2 shadow-sm">
            <Feather name="search" size={16} color={iconMuted} />
            <TextInput
              className="flex-1 ml-2 text-sm text-slate-900 dark:text-white"
              placeholder="Search library..."
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
        </View>

        {isLoadingEmpty ? (
          <View className="gap-y-1 pt-2">
            {[1, 2, 3, 4, 5].map((key) => (
              <View key={key} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[60px] opacity-60 rounded-lg mb-2" />
            ))}
          </View>
        ) : groupedData.length === 0 ? (
          <View className="items-center justify-center pt-16 pb-8 px-4">
            <View className="w-20 h-20 rounded-full bg-slate-200/50 dark:bg-slate-800 items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
              <Feather name={searchQuery ? "search" : "book"} size={32} color={iconMuted} />
            </View>
            <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2 text-center">
              {searchQuery ? "No results found" : "Library is Empty"}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
              {searchQuery
                ? `We couldn't find any series matching "${searchQuery}".`
                : "Completed series and stored shows will appear here."}
            </Text>
          </View>
        ) : (
          <SectionList
            sections={groupedData}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            stickySectionHeadersEnabled={true}
            renderSectionHeader={({ section: { title } }) => (
              <View className="bg-slate-50/95 dark:bg-slate-900/95 pb-2">
                <Text className="text-lg font-bold text-slate-900 dark:text-white px-1">
                  {title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/title/${item.id}`)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded flex-row items-center justify-between p-3"
              >
                <View className="flex-1 pr-4">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
                <View className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {item.totalEpisodes} {item.totalEpisodes === 1 ? 'EP' : 'EPs'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
