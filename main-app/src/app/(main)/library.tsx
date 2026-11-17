import { Feather, Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSync } from "../../lib/SyncContext";
import {
  AniListSearchResult,
  getShowFormats,
  normalizeTitle,
  searchAnimeTitles,
} from "../../lib/anilist";

interface LibraryItem {
  id: string;
  title: string;
  totalEpisodes: number;
  type?: string;
}

interface UndoToastState {
  visible: boolean;
  showId: string;
  showTitle: string;
  secondsLeft: number;
}

export default function LibraryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#f8fafc" : "#0f172a";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";

  const {
    libraryShows,
    activeShows,
    syncStatus,
    syncWithCloud,
    addTitleToLibrary,
    undoAddTitleToLibrary,
    unarchiveToWatching,
  } = useSync();

  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<LibraryItem[]>([]);

  // Selection mode for unarchiving
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Add Title Modal State
  const [addTitleModalVisible, setAddTitleModalVisible] = useState(false);
  const [titleSearchQuery, setTitleSearchQuery] = useState("");
  const [isSearchingTitles, setIsSearchingTitles] = useState(false);
  const [searchResults, setSearchResults] = useState<AniListSearchResult[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<AniListSearchResult | null>(null);
  const [isSubmittingNewTitle, setIsSubmittingNewTitle] = useState(false);

  // Undo Toast State
  const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (libraryShows) {
      const formatted: LibraryItem[] = libraryShows.map((row: any) => ({
        id: row.id,
        title: row.show_name,
        totalEpisodes: row.total_episodes || 0,
      }));
      setItems(formatted);

      if (formatted.length > 0) {
        getShowFormats(formatted).then((formatMap) => {
          setItems((prev) =>
            prev.map((item) => ({
              ...item,
              type: formatMap[item.id] || item.type,
            }))
          );
        });
      }
    }
  }, [libraryShows]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
    };
  }, []);

  const groupedData = useMemo(() => {
    const filtered = items.filter((item) =>
      normalizeTitle(item.title).includes(normalizeTitle(searchQuery))
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

  // Selection handlers
  const handleLongPress = (id: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
    }
  };

  const handlePress = (id: string, title: string) => {
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
      router.push({ pathname: "/title/[id]", params: { id, title } });
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const confirmUnarchive = () => {
    Alert.alert(
      "Unarchive Series",
      `Move ${selectedIds.size} completed series back to Currently Watching?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unarchive",
          style: "default",
          onPress: async () => {
            if (unarchiveToWatching) {
              await unarchiveToWatching(Array.from(selectedIds));
            }
            cancelSelection();
          },
        },
      ]
    );
  };

  // Add Title Modal Handlers
  const openAddTitleModal = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Adding titles to the library requires an active internet connection to search AniList."
      );
      return;
    }

    setTitleSearchQuery("");
    setSearchResults([]);
    setSelectedAnime(null);
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
    // 1. Airing status restriction: Only FINISHED anime can be directly added to Library
    if (anime.rawStatus !== "FINISHED") {
      Alert.alert(
        "Anime Not Finished",
        `"${anime.title}" is currently ${anime.status.toLowerCase()}. Only finished anime can be added directly to the Library.\n\nTo track ongoing or upcoming series, add them to Currently Watching.`
      );
      return;
    }

    // Helper to check if a local show name matches any canonical title or official synonym
    const matchesAnime = (localShowName: string) => {
      const normLocal = normalizeTitle(localShowName);
      const candidates = [
        anime.title,
        anime.romajiTitle,
        anime.nativeTitle,
        ...(anime.synonyms || []),
      ].filter(Boolean);
      return candidates.some((c) => normalizeTitle(c) === normLocal);
    };

    // 2. Check if anime is already in Currently Watching
    const isAlreadyWatching = activeShows?.some((s) => matchesAnime(s.show_name));
    if (isAlreadyWatching) {
      Alert.alert(
        "Already in Watchlist",
        `"${anime.title}" is currently in your Currently Watching list.`
      );
      return;
    }

    // 3. Check if anime is already in Library (Completed)
    const isAlreadyInLibrary = libraryShows?.some((s) => matchesAnime(s.show_name));
    if (isAlreadyInLibrary) {
      Alert.alert(
        "Already in Library",
        `"${anime.title}" is already in your completed Library.`
      );
      return;
    }

    setSelectedAnime(anime);
  };

  const handleSaveNewTitle = async (addAnother: boolean = false) => {
    if (!selectedAnime || !addTitleToLibrary) return;

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please connect to the internet to add this title."
      );
      return;
    }

    setIsSubmittingNewTitle(true);
    try {
      const addedTitle = selectedAnime.title;
      const result = await addTitleToLibrary(
        selectedAnime.title,
        selectedAnime.episodes,
        selectedAnime.synonyms,
        selectedAnime.romajiTitle
      );

      if (undoTimerRef.current) clearInterval(undoTimerRef.current);

      setUndoToast({
        visible: true,
        showId: result.showId,
        showTitle: addedTitle,
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

      if (addAnother) {
        setSelectedAnime(null);
        setTitleSearchQuery("");
        setSearchResults([]);
      } else {
        setAddTitleModalVisible(false);
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to add title to library.";
      Alert.alert("Unable to Add Title", msg);
    } finally {
      setIsSubmittingNewTitle(false);
    }
  };

  const handleUndoAddTitle = async () => {
    if (!undoToast || !undoAddTitleToLibrary) return;
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    undoTimerRef.current = null;

    const showIdToUndo = undoToast.showId;
    setUndoToast(null);
    await undoAddTitleToLibrary(showIdToUndo);
  };

  const isLoadingEmpty = syncStatus === "syncing" && items.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Top Header */}
      <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 px-4 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        {isSelectionMode ? (
          <View className="flex-row items-center justify-between flex-1">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={cancelSelection} className="p-1 mr-2">
                <Feather name="x" size={20} color={primaryColor} />
              </TouchableOpacity>
              <Text className="text-slate-900 dark:text-white font-bold text-base">
                {selectedIds.size} Selected
              </Text>
            </View>
            <TouchableOpacity onPress={cancelSelection}>
              <Text className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View className="flex-row items-center">
              <Ionicons name="library" size={24} color="#2DD4BF" />
              <Text className="text-slate-900 dark:text-white ml-2.5 text-lg font-bold">
                Library
              </Text>
            </View>

            <View className="flex-row items-center">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={openAddTitleModal}
                className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex-row items-center mr-2"
              >
                <Feather name="plus" size={14} color="#2DD4BF" />
                <Text className="text-xs font-bold text-teal-700 dark:text-teal-300 ml-1">
                  Add Title
                </Text>
              </TouchableOpacity>

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
                  <Ionicons name="cloud-done-outline" size={16} color={primaryColor} />
                )}
                {syncStatus === "offline" && (
                  <Ionicons name="cloud-offline-outline" size={16} color="#ef4444" />
                )}
                {syncStatus === "outdated" && (
                  <Ionicons name="cloud-download-outline" size={16} color="#f59e0b" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* SectionList hosting RefreshControl and Header */}
      <View className="flex-1 px-8">
        <SectionList
          sections={groupedData}
          keyExtractor={(item) => item.id}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: isSelectionMode ? 100 : 32 }}
          stickySectionHeadersEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={syncStatus === "syncing"}
              onRefresh={syncWithCloud}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
          ListHeaderComponent={
            <View className="pt-4">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/dashboard")}
                className="flex-row items-center mb-4"
              >
                <Ionicons name="arrow-back" size={18} color={primaryColor} />
                <Text className="ml-1 text-sm font-semibold text-slate-900 dark:text-white">Back</Text>
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
          }
          ListEmptyComponent={
            isLoadingEmpty ? (
              <View className="gap-y-1 pt-2">
                {[1, 2, 3, 4, 5].map((key) => (
                  <View
                    key={key}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[60px] opacity-60 rounded-lg mb-2"
                  />
                ))}
              </View>
            ) : (
              <View className="items-center justify-center pt-16 pb-8 px-4">
                <View className="w-20 h-20 rounded-full bg-slate-200/50 dark:bg-slate-800 items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                  <Feather name={searchQuery ? "search" : "book"} size={32} color={iconMuted} />
                </View>
                <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2 text-center">
                  {searchQuery ? "No results found" : "Library is Empty"}
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-5">
                  {searchQuery
                    ? `We couldn't find any series matching "${searchQuery}".`
                    : "Completed series and stored shows will appear here."}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    onPress={openAddTitleModal}
                    className="px-4 py-2.5 rounded-xl bg-teal-500 flex-row items-center shadow-sm"
                  >
                    <Feather name="plus" size={16} color="#ffffff" />
                    <Text className="text-sm font-bold text-white ml-1.5">
                      Add First Series
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-slate-50/95 dark:bg-slate-900/95 pt-2 pb-1">
              <Text className="text-lg font-bold text-slate-900 dark:text-white px-1">
                {title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onLongPress={() => handleLongPress(item.id)}
                onPress={() => handlePress(item.id, item.title)}
                className={`bg-white dark:bg-slate-800 border shadow-sm flex-row items-center justify-between px-3 py-3 mb-1.5 rounded-lg ${
                  isSelected
                    ? "border-teal-500 bg-teal-50/30 dark:bg-teal-950/20"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                {isSelectionMode && (
                  <View className="mr-3">
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={20}
                      color={isSelected ? "#2DD4BF" : iconMuted}
                    />
                  </View>
                )}

                <View className="flex-1 pr-3">
                  <Text
                    className="text-sm font-bold text-slate-900 dark:text-white"
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </View>

                {item.type ? (
                  <View className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                    <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {item.type}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Floating Action Bar in Selection Mode (Unarchive) */}
      {isSelectionMode && selectedIds.size > 0 && (
        <View className="absolute bottom-6 left-4 right-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex-row items-center justify-between z-40">
          <View>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedIds.size} Selected
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              Move back to Watching
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={confirmUnarchive}
            className="px-4 py-2.5 rounded-xl bg-teal-500 flex-row items-center shadow-sm"
          >
            <Feather name="arrow-up-left" size={16} color="#ffffff" />
            <Text className="text-sm font-bold text-white ml-1.5">Unarchive</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating 5-Second Undo Toast */}
      {undoToast && (
        <View className="absolute bottom-6 left-4 right-4 bg-slate-900 dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-700 flex-row items-center justify-between z-50">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-bold text-white" numberOfLines={1}>
              Added "{undoToast.showTitle}" to Library
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5">
              Tap Undo within {undoToast.secondsLeft}s to revert
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleUndoAddTitle}
            className="px-3 py-1.5 rounded-lg bg-teal-500 flex-row items-center"
          >
            <Feather name="rotate-ccw" size={14} color="#ffffff" />
            <Text className="text-xs font-bold text-white ml-1">Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Title Modal */}
      <Modal
        visible={addTitleModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmittingNewTitle) setAddTitleModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/60 items-center justify-center p-4"
        >
          <View className="w-full max-w-sm h-[520px] max-h-[85%] bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-700 flex-col">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-700">
              <View className="flex-row items-center">
                <Ionicons name="library" size={20} color="#2DD4BF" />
                <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
                  {selectedAnime ? "Confirm Archive" : "Add to Library"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (selectedAnime) {
                    setSelectedAnime(null);
                  } else {
                    setAddTitleModalVisible(false);
                  }
                }}
                disabled={isSubmittingNewTitle}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center"
              >
                <Feather
                  name={selectedAnime ? "arrow-left" : "x"}
                  size={16}
                  color={iconMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {!selectedAnime ? (
              /* STEP 1: Search AniList */
              <View className="flex-1 flex-col">
                <View className="flex-row items-center bg-slate-100 dark:bg-slate-900 rounded-xl px-3 py-2 mb-3 border border-slate-200 dark:border-slate-700">
                  <Feather name="search" size={16} color={iconMuted} />
                  <TextInput
                    value={titleSearchQuery}
                    onChangeText={handleTitleSearchChange}
                    placeholder="Search finished anime title..."
                    placeholderTextColor={iconMuted}
                    className="flex-1 ml-2 text-sm text-slate-900 dark:text-white"
                    autoFocus={true}
                    autoCorrect={false}
                  />
                  {titleSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => handleTitleSearchChange("")}>
                      <Feather name="x" size={14} color={iconMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {isSearchingTitles ? (
                  <View className="py-10 items-center justify-center">
                    <ActivityIndicator size="small" color="#2DD4BF" />
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Searching AniList...
                    </Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 16 }}
                  >
                    <View className="gap-y-2">
                      {searchResults.map((anime) => {
                        const isFinished = anime.rawStatus === "FINISHED";

                        return (
                          <TouchableOpacity
                            key={anime.id}
                            activeOpacity={0.7}
                            onPress={() => handleSelectAnime(anime)}
                            className={`p-2.5 rounded-xl border flex-row items-center justify-between ${
                              isFinished
                                ? "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700"
                                : "bg-slate-100/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800 opacity-60"
                            }`}
                          >
                            <View className="flex-row items-center flex-1 mr-2">
                              {anime.coverImageUrl ? (
                                <Image
                                  source={{ uri: anime.coverImageUrl }}
                                  className="w-10 h-14 rounded bg-slate-200 dark:bg-slate-700 mr-2.5"
                                  resizeMode="cover"
                                />
                              ) : null}
                              <View className="flex-1">
                                <Text
                                  className="text-xs font-bold text-slate-900 dark:text-white"
                                  numberOfLines={2}
                                >
                                  {anime.title}
                                </Text>
                                <View className="flex-row items-center mt-1 flex-wrap gap-1">
                                  {anime.format && (
                                    <View className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                      <Text className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                        {anime.format}
                                      </Text>
                                    </View>
                                  )}
                                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    {anime.episodes ? `${anime.episodes} eps` : "Eps TBA"}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {isFinished ? (
                              <View className="bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-1 rounded-md flex-row items-center">
                                <Feather name="check" size={10} color="#2DD4BF" />
                                <Text className="text-[10px] font-bold text-teal-700 dark:text-teal-300 ml-1">
                                  Finished
                                </Text>
                              </View>
                            ) : (
                              <View className="bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-md flex-row items-center">
                                <Feather name="lock" size={10} color={iconMuted} />
                                <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                                  {anime.status || "Ongoing"}
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
                      Search for completed anime to archive directly into Library.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* STEP 2: Review & Confirm Direct Archive */
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {/* Selected Anime Card */}
                <View className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 mb-4 flex-row items-center">
                  {selectedAnime.coverImageUrl ? (
                    <Image
                      source={{ uri: selectedAnime.coverImageUrl }}
                      className="w-14 h-20 rounded-md bg-slate-200 dark:bg-slate-700 mr-3"
                      resizeMode="cover"
                    />
                  ) : null}
                  <View className="flex-1">
                    <Text
                      className="text-sm font-bold text-slate-900 dark:text-white"
                      numberOfLines={2}
                    >
                      {selectedAnime.title}
                    </Text>
                    <View className="flex-row items-center mt-1 flex-wrap gap-1">
                      {selectedAnime.format && (
                        <View className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          <Text className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {selectedAnime.format}
                          </Text>
                        </View>
                      )}
                      <View className="bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-1.5 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                          {selectedAnime.episodes ? `${selectedAnime.episodes} Episodes` : "Finished"}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-teal-600 dark:text-teal-400 font-bold mt-1.5">
                      All {selectedAnime.episodes || 0} episodes marked completed
                    </Text>
                  </View>
                </View>

                {/* Info Notice */}
                <View className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 rounded-xl p-3 mb-6">
                  <View className="flex-row items-center mb-1">
                    <Feather name="info" size={14} color="#2DD4BF" />
                    <Text className="text-xs font-bold text-teal-800 dark:text-teal-300 ml-1.5">
                      Direct Library Archive
                    </Text>
                  </View>
                  <Text className="text-xs text-teal-700 dark:text-teal-400">
                    This series will be stored directly as completed in your Library with no individual episode logs recorded in watch history.
                  </Text>
                </View>

                {/* Action Buttons */}
                <View className="gap-y-2 mt-auto">
                  <TouchableOpacity
                    onPress={() => handleSaveNewTitle(false)}
                    disabled={isSubmittingNewTitle}
                    className="w-full py-3 bg-teal-500 rounded-xl items-center justify-center shadow-sm"
                  >
                    {isSubmittingNewTitle ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <View className="flex-row items-center">
                        <Feather name="archive" size={16} color="#ffffff" />
                        <Text className="text-sm font-bold text-white ml-2">
                          Add to Library
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSaveNewTitle(true)}
                    disabled={isSubmittingNewTitle}
                    className="w-full py-2.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl items-center justify-center shadow-sm"
                  >
                    <View className="flex-row items-center">
                      <Feather name="plus" size={15} color="#2DD4BF" />
                      <Text className="text-sm font-bold text-teal-700 dark:text-teal-300 ml-1.5">
                        Add & Add Another
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedAnime(null)}
                    disabled={isSubmittingNewTitle}
                    className="w-full py-2 items-center justify-center"
                  >
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Choose Another Title
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
