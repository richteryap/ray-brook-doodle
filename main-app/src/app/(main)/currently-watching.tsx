import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
import {
  searchAnimeTitles,
  AniListSearchResult,
  checkEpisodeAired,
} from "../../lib/anilist";

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
  const primaryColor = isDark ? "#f8fafc" : "#0f172a";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";
  
  const {
    activeShows,
    syncStatus,
    syncWithCloud,
    dropActiveShows,
    moveToLibrary,
    manualLogEpisode,
    undoManualLog,
    manualLogNewTitle,
    undoManualLogNewTitle,
  } = useSync();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [sortOrder, setSortOrder] = useState<"Chronological" | "Alphabetical">("Chronological");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Manual Log Modal State
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [loggingShow, setLoggingShow] = useState<MediaItem | null>(null);
  const [targetEpisode, setTargetEpisode] = useState<number>(1);
  const [logDateInput, setLogDateInput] = useState("");
  const [logTimeInput, setLogTimeInput] = useState("");
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [checkingShowId, setCheckingShowId] = useState<string | null>(null);

  // Add Title Modal State
  const [addTitleModalVisible, setAddTitleModalVisible] = useState(false);
  const [titleSearchQuery, setTitleSearchQuery] = useState("");
  const [isSearchingTitles, setIsSearchingTitles] = useState(false);
  const [searchResults, setSearchResults] = useState<AniListSearchResult[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<AniListSearchResult | null>(null);
  const [addTitleDateInput, setAddTitleDateInput] = useState("");
  const [addTitleTimeInput, setAddTitleTimeInput] = useState("");
  const [isSubmittingNewTitle, setIsSubmittingNewTitle] = useState(false);
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 5-Second Undo Toast State
  const [undoToast, setUndoToast] = useState<{
    visible: boolean;
    showId: string;
    showTitle: string;
    episode: number;
    logId: string;
    isNewShow?: boolean;
    previousEpisode?: number;
    previousDate?: string;
    secondsLeft: number;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getDeviceCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
    };
  };

  const openManualLog = async (item: MediaItem) => {
    const nextEp = item.currentEpisode + 1;

    // 1. Local fast check: If already completed
    if (item.totalEpisodes && nextEp > item.totalEpisodes) {
      Alert.alert(
        "Series Completed",
        `You have already logged all ${item.totalEpisodes} episodes of "${item.title}".`
      );
      return;
    }

    // 2. Airing validation against AniList
    setCheckingShowId(item.id);
    try {
      const airingCheck = await checkEpisodeAired(item.title, nextEp);
      if (!airingCheck.isAired) {
        Alert.alert(
          "Episode Not Aired Yet",
          airingCheck.reason ||
            `Episode ${nextEp} of "${item.title}" has not aired yet.`
        );
        return;
      }

      const dt = getDeviceCurrentDateTime();
      setLoggingShow(item);
      setTargetEpisode(nextEp);
      setLogDateInput(dt.date);
      setLogTimeInput(dt.time);
      setLogModalVisible(true);
    } finally {
      setCheckingShowId(null);
    }
  };

  const handleSaveLog = async () => {
    if (!loggingShow || !manualLogEpisode) return;

    let chosenDate: Date;
    try {
      const [year, month, day] = logDateInput.split("-").map(Number);
      const [hours, minutes] = logTimeInput.split(":").map(Number);
      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day) ||
        isNaN(hours) ||
        isNaN(minutes)
      ) {
        throw new Error("Invalid format");
      }
      chosenDate = new Date(year, month - 1, day, hours, minutes);
      if (isNaN(chosenDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch {
      Alert.alert(
        "Invalid Date/Time",
        "Please use YYYY-MM-DD for date and HH:mm (24-hour) for time, or tap 'Reset to Now'."
      );
      return;
    }

    setIsSubmittingLog(true);
    try {
      const result = await manualLogEpisode(
        loggingShow.id,
        loggingShow.title,
        targetEpisode,
        chosenDate
      );

      setLogModalVisible(false);

      if (undoTimerRef.current) clearInterval(undoTimerRef.current);

      setUndoToast({
        visible: true,
        showId: loggingShow.id,
        showTitle: loggingShow.title,
        episode: targetEpisode,
        logId: result.logId,
        previousEpisode: result.previousEpisode,
        previousDate: result.previousDate,
        secondsLeft: 5,
      });

      let remaining = 5;
      undoTimerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (undoTimerRef.current) clearInterval(undoTimerRef.current);
          undoTimerRef.current = null;
          setUndoToast(null);
        } else {
          setUndoToast((prev) => (prev ? { ...prev, secondsLeft: remaining } : null));
        }
      }, 1000);
    } catch (err: any) {
      Alert.alert("Error logging episode", err?.message || "Failed to log episode.");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleUndo = async () => {
    if (!undoToast) return;
    if (undoTimerRef.current) {
      clearInterval(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const { showId, previousEpisode, previousDate, logId, isNewShow } = undoToast;
    setUndoToast(null);

    if (isNewShow && undoManualLogNewTitle) {
      await undoManualLogNewTitle(showId, logId, true);
    } else if (undoManualLog && previousEpisode !== undefined && previousDate !== undefined) {
      await undoManualLog(showId, previousEpisode, previousDate, logId);
    }
  };

  const openAddTitleModal = () => {
    const dt = getDeviceCurrentDateTime();
    setTitleSearchQuery("");
    setSearchResults([]);
    setSelectedAnime(null);
    setAddTitleDateInput(dt.date);
    setAddTitleTimeInput(dt.time);
    setAddTitleModalVisible(true);
  };

  const handleTitleSearchChange = (text: string) => {
    setTitleSearchQuery(text);
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setIsSearchingTitles(false);
      return;
    }

    setIsSearchingTitles(true);
    searchDebounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchAnimeTitles(text);
        setSearchResults(results);
      } catch (err) {
        console.warn("AniList search error:", err);
      } finally {
        setIsSearchingTitles(false);
      }
    }, 350);
  };

  const handleSelectAnime = (anime: AniListSearchResult) => {
    setSelectedAnime(anime);
    const dt = getDeviceCurrentDateTime();
    setAddTitleDateInput(dt.date);
    setAddTitleTimeInput(dt.time);
  };

  const handleSaveNewTitle = async () => {
    if (!selectedAnime || !manualLogNewTitle) return;

    let chosenDate: Date;
    try {
      const [year, month, day] = addTitleDateInput.split("-").map(Number);
      const [hours, minutes] = addTitleTimeInput.split(":").map(Number);
      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day) ||
        isNaN(hours) ||
        isNaN(minutes)
      ) {
        throw new Error("Invalid format");
      }
      chosenDate = new Date(year, month - 1, day, hours, minutes);
      if (isNaN(chosenDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch {
      Alert.alert(
        "Invalid Date/Time",
        "Please use YYYY-MM-DD for date and HH:mm (24-hour) for time, or tap 'Reset to Now'."
      );
      return;
    }

    setIsSubmittingNewTitle(true);
    try {
      const result = await manualLogNewTitle(
        selectedAnime.title,
        selectedAnime.episodes,
        chosenDate
      );

      setAddTitleModalVisible(false);

      if (undoTimerRef.current) clearInterval(undoTimerRef.current);

      setUndoToast({
        visible: true,
        showId: result.showId,
        showTitle: selectedAnime.title,
        episode: 1,
        logId: result.logId,
        isNewShow: result.isNewShow,
        previousEpisode: result.previousEpisode,
        previousDate: result.previousDate,
        secondsLeft: 5,
      });

      let remaining = 5;
      undoTimerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (undoTimerRef.current) clearInterval(undoTimerRef.current);
          undoTimerRef.current = null;
          setUndoToast(null);
        } else {
          setUndoToast((prev) => (prev ? { ...prev, secondsLeft: remaining } : null));
        }
      }, 1000);
    } catch (err: any) {
      Alert.alert("Error logging title", err?.message || "Failed to add title.");
    } finally {
      setIsSubmittingNewTitle(false);
    }
  };

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
    };
  }, []);

  const isLoadingEmpty = syncStatus === "syncing" && items.length === 0;

  const canMoveToLibrary =
    selectedIds.size > 0 &&
    Array.from(selectedIds).every((id) => {
      const item = items.find((i) => i.id === id);
      return item && item.totalEpisodes && item.currentEpisode >= item.totalEpisodes;
    });

  const confirmMoveToLibrary = () => {
    Alert.alert(
      "Move to Library",
      `Archive ${selectedIds.size} completed series to your Library?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move",
          style: "default",
          onPress: async () => {
            if (moveToLibrary) {
              await moveToLibrary(Array.from(selectedIds));
            }
            cancelSelection();
          },
        },
      ]
    );
  };

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
      const selectedItem = items.find((i) => i.id === id);
      router.push({
        pathname: "/title/[id]",
        params: { id, title: selectedItem?.title || "" },
      });
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
      {/* Top Header */}
      <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 px-4 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <View className="flex-row items-center">
          <Ionicons name="play-circle" size={24} color="#EF4444" />
          <Text className="text-slate-900 dark:text-white ml-2.5 text-lg font-bold">
            Currently Watching
          </Text>
        </View>

        <View className="flex-row items-center gap-x-2">
          {!isSelectionMode && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openAddTitleModal}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 active:bg-emerald-600 flex-row items-center shadow-xs"
            >
              <Feather name="plus" size={13} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Add Title</Text>
            </TouchableOpacity>
          )}

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
      </View>

      {/* Bulk Action Controls */}
      {isSelectionMode && (
        <View className="px-4 pt-4 pb-2 bg-slate-50 dark:bg-slate-900 z-10">
          <View className="flex-row items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <TouchableOpacity onPress={cancelSelection} className="px-3 py-1">
              <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400">Cancel</Text>
            </TouchableOpacity>

            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedIds.size} Selected
            </Text>

            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={confirmMoveToLibrary}
                disabled={!canMoveToLibrary}
                className={`px-3 py-1 rounded mr-2 ${
                  canMoveToLibrary ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    canMoveToLibrary ? "text-white" : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  Library
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} className="px-3 py-1 bg-red-500 rounded">
                <Text className="text-sm font-bold text-white">Drop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Series List */}
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
        {!isSelectionMode && (
          <View className="pt-4 pb-4">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/dashboard")}
              className="flex-row items-center mb-4"
            >
              <Ionicons name="arrow-back" size={18} color={primaryColor} />
              <Text className="ml-1 text-sm font-semibold text-slate-900 dark:text-white">Back</Text>
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
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={toggleSort}
                  className="flex-row items-center bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded"
                >
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">{sortOrder}</Text>
                  <Feather
                    name={sortOrder === "Chronological" ? "arrow-down" : "arrow-up"}
                    size={14}
                    color={primaryColor}
                    className="ml-1"
                  />
                </TouchableOpacity>
              </View>

              <View className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {sortedItems.length} Series
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className={isSelectionMode ? "gap-y-1 pt-2" : "gap-y-1"}>
          {isLoadingEmpty ? (
            [1, 2, 3, 4].map((key) => (
              <View
                key={key}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[104px] opacity-60"
              >
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
              const isCompleted =
                item.totalEpisodes ? item.currentEpisode >= item.totalEpisodes : false;
              const isSelected = selectedIds.has(item.id);

              return (
                <View
                  key={item.id}
                  className={`relative bg-white dark:bg-slate-800 border ${
                    isSelected
                      ? "border-slate-900 dark:border-white border-2"
                      : "border-slate-200 dark:border-slate-700"
                  } shadow-sm overflow-hidden flex-row`}
                >
                  {isSelectionMode && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handlePress(item.id)}
                      className="w-12 items-center justify-center bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
                    >
                      <View
                        className={`w-5 h-5 rounded border ${
                          isSelected ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white" : "border-slate-400"
                        }`}
                      >
                        {isSelected && <Feather name="check" size={14} color={isDark ? "#0f172a" : "white"} />}
                      </View>
                    </TouchableOpacity>
                  )}

                  <View className="flex-1">
                    <View
                      className={`absolute top-0 left-0 px-4 py-0 rounded-br-xl z-10 ${
                        isCompleted ? "bg-emerald-500" : "bg-cyan-500"
                      }`}
                    >
                      <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                        {isCompleted ? "Completed" : "Watching"}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between pt-4 pb-1 px-3 border-b border-slate-200 dark:border-slate-700 mt-2">
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onLongPress={() => handleLongPress(item.id)}
                        onPress={() => handlePress(item.id)}
                        className="flex-1 pr-3"
                      >
                        <Text
                          className="text-sm font-bold text-slate-900 dark:text-white"
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                      </TouchableOpacity>

                      {!isSelectionMode && (
                        isCompleted ? (
                          <View className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700 flex-row items-center justify-center">
                            <Feather name="check" size={12} color={iconMuted} />
                            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                              Done
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => openManualLog(item)}
                            disabled={checkingShowId === item.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 active:bg-emerald-600 flex-row items-center justify-center shadow-xs min-w-[38px] h-[26px]"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            {checkingShowId === item.id ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <>
                                <Feather name="plus" size={12} color="#ffffff" />
                                <Text className="text-xs font-bold text-white ml-0.5">
                                  1
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )
                      )}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onLongPress={() => handleLongPress(item.id)}
                      onPress={() => handlePress(item.id)}
                    >
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
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Manual Log Modal */}
      <Modal
        visible={logModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-4">
          <View className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xl">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
              <View className="flex-row items-center flex-1 pr-2">
                <Ionicons name="play-circle" size={20} color="#EF4444" />
                <Text
                  className="text-base font-bold text-slate-900 dark:text-white ml-2 flex-1"
                  numberOfLines={1}
                >
                  Log Episode
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setLogModalVisible(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center"
              >
                <Feather name="x" size={14} color={iconMuted} />
              </TouchableOpacity>
            </View>

            {/* Warning Banner */}
            <View className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg p-3 mb-4">
              <View className="flex-row items-center mb-1">
                <Feather name="alert-triangle" size={14} color="#d97706" />
                <Text className="text-xs font-bold text-amber-800 dark:text-amber-300 ml-1.5">
                  Notice
                </Text>
              </View>
              <Text className="text-xs text-amber-700 dark:text-amber-400">
                This action cannot be undone after the 5-second popup disappears.
              </Text>
            </View>

            {/* Show Details & Next Episode */}
            <View className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 mb-4">
              <Text
                className="text-sm font-bold text-slate-900 dark:text-white mb-2"
                numberOfLines={2}
              >
                {loggingShow?.title}
              </Text>

              <View className="flex-row items-center">
                <Text className="text-sm text-slate-600 dark:text-slate-300">
                  Episode {loggingShow?.currentEpisode}{" "}
                  <Text className="text-slate-400 dark:text-slate-500 font-bold">➔</Text>{" "}
                  <Text className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    Episode {targetEpisode}
                  </Text>
                  {loggingShow?.totalEpisodes ? ` of ${loggingShow.totalEpisodes}` : ""}
                </Text>
              </View>
            </View>

            {/* Date & Time Fields */}
            <View className="gap-y-3 mb-4">
              <View>
                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Date (YYYY-MM-DD)
                </Text>
                <TextInput
                  value={logDateInput}
                  onChangeText={setLogDateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={iconMuted}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Time (HH:mm - 24hr)
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const dt = getDeviceCurrentDateTime();
                      setLogDateInput(dt.date);
                      setLogTimeInput(dt.time);
                    }}
                  >
                    <Text className="text-xs font-bold text-slate-900 dark:text-white underline">
                      Reset to Now
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={logTimeInput}
                  onChangeText={setLogTimeInput}
                  placeholder="HH:mm"
                  placeholderTextColor={iconMuted}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Modal Actions */}
            <View className="flex-row items-center gap-x-2 pt-2">
              <TouchableOpacity
                onPress={() => setLogModalVisible(false)}
                disabled={isSubmittingLog}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 items-center justify-center"
              >
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveLog}
                disabled={isSubmittingLog}
                className="flex-1 py-2.5 rounded-lg bg-emerald-500 active:bg-emerald-600 items-center justify-center shadow-sm"
              >
                <Text className="text-sm font-bold text-white">
                  {isSubmittingLog ? "Saving..." : "Save & Log"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Title Search Modal */}
      <Modal
        visible={addTitleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddTitleModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-4 py-8">
          <View className="w-full max-w-sm h-[520px] max-h-[85%] bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xl flex-col">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
              <View className="flex-row items-center flex-1 pr-2">
                <Ionicons name="tv" size={20} color="#10B981" />
                <Text
                  className="text-base font-bold text-slate-900 dark:text-white ml-2 flex-1"
                  numberOfLines={1}
                >
                  {selectedAnime ? "Log New Title" : "Search AniList Title"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAddTitleModalVisible(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center"
              >
                <Feather name="x" size={14} color={iconMuted} />
              </TouchableOpacity>
            </View>

            {/* STEP 1: Search & Select Anime */}
            {!selectedAnime ? (
              <View className="flex-1">
                {/* Search Input */}
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 mb-3">
                  <Feather name="search" size={16} color={iconMuted} />
                  <TextInput
                    value={titleSearchQuery}
                    onChangeText={handleTitleSearchChange}
                    placeholder="Search anime title..."
                    placeholderTextColor={iconMuted}
                    autoFocus
                    className="flex-1 ml-2 text-sm text-slate-900 dark:text-white"
                  />
                  {titleSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => handleTitleSearchChange("")}>
                      <Feather name="x" size={16} color={iconMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Search Results / Loading / Empty */}
                {isSearchingTitles ? (
                  <View className="py-10 items-center justify-center">
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Searching AniList...
                    </Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 8 }}
                  >
                    <View className="gap-y-2">
                      {searchResults.map((anime) => {
                        const isAddable = anime.isAddable;

                        return (
                          <TouchableOpacity
                            key={anime.id}
                            activeOpacity={isAddable ? 0.7 : 1}
                            disabled={!isAddable}
                            onPress={() => isAddable && handleSelectAnime(anime)}
                            className={`flex-row p-2.5 rounded-xl border ${
                              isAddable
                                ? "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700"
                                : "bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800 opacity-60"
                            } items-center`}
                          >
                            {anime.coverImageUrl ? (
                              <Image
                                source={{ uri: anime.coverImageUrl }}
                                className="w-11 h-14 rounded-md bg-slate-200 dark:bg-slate-700"
                                resizeMode="cover"
                              />
                            ) : (
                              <View className="w-11 h-14 rounded-md bg-slate-200 dark:bg-slate-700 items-center justify-center">
                                <Feather name="tv" size={16} color={iconMuted} />
                              </View>
                            )}

                            <View className="flex-1 ml-3 pr-2">
                              <Text
                                className={`text-xs font-bold ${
                                  isAddable
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-500 dark:text-slate-400"
                                }`}
                                numberOfLines={2}
                              >
                                {anime.title}
                              </Text>
                              {anime.romajiTitle && anime.romajiTitle !== anime.title ? (
                                <Text
                                  className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5"
                                  numberOfLines={1}
                                >
                                  {anime.romajiTitle}
                                </Text>
                              ) : null}

                              {/* Badges Row */}
                              <View className="flex-row items-center mt-1.5 flex-wrap gap-1.5">
                                {/* Airing Status Badge */}
                                {anime.status === "Currently Airing" && (
                                  <View className="bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                                    <Text className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                                      Airing
                                    </Text>
                                  </View>
                                )}
                                {anime.status === "Finished Airing" && (
                                  <View className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    <Text className="text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                      Finished
                                    </Text>
                                  </View>
                                )}
                                {anime.status === "On Hiatus" && (
                                  <View className="bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                                    <Text className="text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                      Hiatus
                                    </Text>
                                  </View>
                                )}
                                {!isAddable && (
                                  <View className="bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/60 flex-row items-center">
                                    <Feather name="lock" size={8} color="#e11d48" />
                                    <Text className="text-[9px] font-bold text-rose-700 dark:text-rose-400 ml-0.5">
                                      {anime.status}
                                    </Text>
                                  </View>
                                )}

                                {anime.format && (
                                  <Text className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                    {anime.format}
                                  </Text>
                                )}
                                {anime.seasonYear && (
                                  <Text className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {anime.seasonYear}
                                  </Text>
                                )}
                                {anime.episodes ? (
                                  <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                    {anime.episodes} eps
                                  </Text>
                                ) : null}
                              </View>
                            </View>

                            {isAddable ? (
                              <Feather name="chevron-right" size={16} color={iconMuted} />
                            ) : (
                              <View className="bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-1 rounded">
                                <Text className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                  Not Aired
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                ) : titleSearchQuery.trim().length > 1 ? (
                  <View className="py-10 items-center justify-center">
                    <Feather name="frown" size={24} color={iconMuted} />
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                      No titles found for "{titleSearchQuery}".{"\n"}Try another spelling.
                    </Text>
                  </View>
                ) : (
                  <View className="py-10 items-center justify-center">
                    <Feather name="search" size={24} color={iconMuted} />
                    <Text className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
                      Type an anime title to search on AniList.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* STEP 2: Review & Confirm Genesis */
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {/* Warning Banner */}
                <View className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg p-3 mb-3">
                  <View className="flex-row items-center mb-1">
                    <Feather name="alert-triangle" size={14} color="#d97706" />
                    <Text className="text-xs font-bold text-amber-800 dark:text-amber-300 ml-1.5">
                      Notice
                    </Text>
                  </View>
                  <Text className="text-xs text-amber-700 dark:text-amber-400">
                    This action cannot be undone after the 5-second popup disappears.
                  </Text>
                </View>

                {/* Selected Anime Card */}
                <View className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 mb-3 flex-row items-center">
                  {selectedAnime.coverImageUrl ? (
                    <Image
                      source={{ uri: selectedAnime.coverImageUrl }}
                      className="w-12 h-16 rounded-md bg-slate-200 dark:bg-slate-700 mr-3"
                      resizeMode="cover"
                    />
                  ) : null}
                  <View className="flex-1">
                    <Text
                      className="text-xs font-bold text-slate-900 dark:text-white"
                      numberOfLines={2}
                    >
                      {selectedAnime.title}
                    </Text>
                    <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      Starting at Episode 1
                      {selectedAnime.episodes ? ` of ${selectedAnime.episodes}` : ""}
                    </Text>
                  </View>
                </View>

                {/* Date & Time Fields */}
                <View className="gap-y-2.5 mb-4">
                  <View>
                    <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Date (YYYY-MM-DD)
                    </Text>
                    <TextInput
                      value={addTitleDateInput}
                      onChangeText={setAddTitleDateInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={iconMuted}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>

                  <View>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Time (HH:mm - 24hr)
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const dt = getDeviceCurrentDateTime();
                          setAddTitleDateInput(dt.date);
                          setAddTitleTimeInput(dt.time);
                        }}
                      >
                        <Text className="text-xs font-bold text-slate-900 dark:text-white underline">
                          Reset to Now
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      value={addTitleTimeInput}
                      onChangeText={setAddTitleTimeInput}
                      placeholder="HH:mm"
                      placeholderTextColor={iconMuted}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row items-center gap-x-2 pt-1 pb-2">
                  <TouchableOpacity
                    onPress={() => setSelectedAnime(null)}
                    disabled={isSubmittingNewTitle}
                    className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 items-center justify-center"
                  >
                    <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Back
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveNewTitle}
                    disabled={isSubmittingNewTitle}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-500 active:bg-emerald-600 items-center justify-center shadow-sm"
                  >
                    <Text className="text-sm font-bold text-white">
                      {isSubmittingNewTitle ? "Adding..." : "Log Ep 1"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 5-Second Undo Toast */}
      {undoToast && (
        <View className="absolute bottom-6 left-4 right-4 z-50 bg-slate-900 dark:bg-white border border-slate-800 dark:border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <View className="flex-row items-center justify-between p-3.5">
            <View className="flex-row items-center flex-1 pr-2">
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <View className="ml-2.5 flex-1">
                <Text
                  className="text-xs font-bold text-white dark:text-slate-900"
                  numberOfLines={1}
                >
                  Logged Ep {undoToast.episode}: {undoToast.showTitle}
                </Text>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500">
                  Undo expires in {undoToast.secondsLeft}s
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleUndo}
              className="px-3 py-1.5 rounded-lg bg-amber-500 flex-row items-center shadow-xs"
            >
              <Feather name="rotate-ccw" size={12} color="#ffffff" />
              <Text className="text-xs font-bold text-white ml-1">Undo</Text>
            </TouchableOpacity>
          </View>

          {/* Countdown Progress Bar */}
          <View className="h-1 bg-slate-800 dark:bg-slate-200 w-full overflow-hidden">
            <View
              className="h-full bg-amber-500"
              style={{ width: `${(undoToast.secondsLeft / 5) * 100}%` }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}