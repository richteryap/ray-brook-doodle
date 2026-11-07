import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AniListMediaData, getTitleDetails, normalizeTitle } from "../../lib/anilist";
import { useSync } from "../../lib/SyncContext";

export default function TitleDetailsScreen() {
  const router = useRouter();
  const { id, title: paramTitle } = useLocalSearchParams<{ id: string; title?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#f8fafc" : "#0f172a";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";

  const { activeShows, libraryShows, logs, syncStatus, syncWithCloud } = useSync();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animeData, setAnimeData] = useState<AniListMediaData | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [errorState, setErrorState] = useState<"offline" | "not_found" | "failed" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Resolve search title from params or local sync state
  const resolvedTitle = (() => {
    if (paramTitle && paramTitle.trim().length > 0) {
      return paramTitle.trim();
    }
    const matched =
      activeShows?.find((s) => s.id === id) ||
      libraryShows?.find((s) => s.id === id) ||
      logs?.find((l) => l.id === id);

    return matched?.show_name || matched?.title || "";
  })();

  const loadDetails = useCallback(
    async (forceRefresh = false) => {
      if (!id || !resolvedTitle) {
        setLoading(false);
        setErrorState("not_found");
        setErrorMessage("Anime title could not be identified.");
        return;
      }

      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorState(null);

      const result = await getTitleDetails(id, resolvedTitle, forceRefresh);

      if (result.success) {
        setAnimeData(result.data);
        setIsFromCache(result.isFromCache);
        setErrorState(null);
      } else {
        setErrorState(result.error);
        setErrorMessage(result.message);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [id, resolvedTitle]
  );

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/dashboard");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Top Header matching app convention with purple header logo */}
      <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 px-4 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <View className="flex-row items-center">
          <Feather name="tv" size={24} color="#A855F7" />
          <Text className="text-slate-900 dark:text-white ml-2.5 text-lg font-bold">
            Anime Details
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={syncWithCloud}
          disabled={syncStatus === "syncing"}
          className="w-8 h-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
        >
          {syncStatus === "syncing" && <Feather name="refresh-cw" size={14} color={iconMuted} />}
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

      {/* Navigation Sub-header */}
      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={18} color={primaryColor} />
          <Text className="ml-1 text-sm font-semibold text-slate-900 dark:text-white">Back</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="text-base font-bold text-slate-900 dark:text-white mt-4 text-center">
            Getting data from AniList...
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
            Fetching synopsis, studio, and broadcast details
          </Text>
        </View>
      ) : errorState === "offline" ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 items-center justify-center mb-4 border border-red-200 dark:border-red-500/20">
            <Ionicons name="cloud-offline-outline" size={36} color="#ef4444" />
          </View>
          <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
            You're Offline
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-xs">
            Connect to the internet to load details from AniList. Once fetched, details are saved for
            5 weeks of offline access.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => loadDetails(true)}
            className="px-6 py-3 bg-slate-900 dark:bg-white rounded-xl shadow-sm"
          >
            <Text className="text-white dark:text-slate-900 font-bold text-sm">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : errorState ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
            <Feather name="alert-circle" size={36} color={iconMuted} />
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">
            No Details Available
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-xs">
            {errorMessage || "We couldn't retrieve metadata for this series from AniList."}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => loadDetails(true)}
            className="px-6 py-3 bg-slate-900 dark:bg-white rounded-xl shadow-sm"
          >
            <Text className="text-white dark:text-slate-900 font-bold text-sm">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : animeData ? (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadDetails(true)}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          {/* Cache Status Banner */}
          {isFromCache && (
            <View className="flex-row items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg py-1.5 px-3 mb-3 border border-slate-200 dark:border-slate-700">
              <Feather name="hard-drive" size={12} color={iconMuted} />
              <Text className="text-[11px] text-slate-600 dark:text-slate-300 ml-1.5 font-medium">
                Offline Cache Active (5-week countdown refreshed)
              </Text>
            </View>
          )}

          {/* Hero Card */}
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-3">
            <View className="flex-row">
              {animeData.coverImageUrl ? (
                <Image
                  source={{ uri: animeData.coverImageUrl }}
                  className="w-28 h-40 rounded-xl bg-slate-100 dark:bg-slate-700 mr-4"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-28 h-40 rounded-xl bg-slate-100 dark:bg-slate-700 mr-4 items-center justify-center border border-slate-200 dark:border-slate-600">
                  <Feather name="film" size={28} color={iconMuted} />
                </View>
              )}

              <View className="flex-1 justify-between py-1">
                <View>
                  <Text
                    className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1"
                    numberOfLines={3}
                  >
                    {animeData.englishTitle}
                  </Text>
                  {animeData.romajiTitle &&
                  normalizeTitle(animeData.romajiTitle) !==
                    normalizeTitle(animeData.englishTitle) ? (
                    <Text
                      className="text-xs text-slate-600 dark:text-slate-300 font-medium italic mb-0.5"
                      numberOfLines={2}
                    >
                      {animeData.romajiTitle}
                    </Text>
                  ) : null}
                  {animeData.nativeTitle ? (
                    <Text
                      className="text-xs text-slate-400 dark:text-slate-500 font-medium"
                      numberOfLines={2}
                    >
                      {animeData.nativeTitle}
                    </Text>
                  ) : null}
                </View>

                {/* Quick Info Tags */}
                <View className="gap-y-1.5 mt-2">
                  <View className="flex-row items-center flex-wrap gap-1.5">
                    {animeData.format ? (
                      <View className="px-2.5 py-0.5 rounded-md border bg-slate-900 dark:bg-white border-slate-900 dark:border-white">
                        <Text className="text-[11px] font-bold text-white dark:text-slate-900">
                          {animeData.format}
                        </Text>
                      </View>
                    ) : null}
                    <View className="px-2.5 py-0.5 rounded-md border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <Text className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {animeData.status}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Episodes:{" "}
                    <Text className="font-bold text-slate-900 dark:text-white">
                      {animeData.episodes ? animeData.episodes : "Ongoing / TBA"}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Broadcast & Production Information */}
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-3 gap-y-3">
            {animeData.format ? (
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <View className="flex-row items-center">
                  <Feather name="layers" size={16} color={iconMuted} />
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
                    Type
                  </Text>
                </View>
                <Text className="text-xs font-bold text-slate-900 dark:text-white">
                  {animeData.format}
                </Text>
              </View>
            ) : null}

            {animeData.premiered ? (
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <View className="flex-row items-center">
                  <Feather name="compass" size={16} color={iconMuted} />
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
                    Premiered
                  </Text>
                </View>
                <Text className="text-xs font-bold text-slate-900 dark:text-white">
                  {animeData.premiered}
                </Text>
              </View>
            ) : null}

            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/50">
              <View className="flex-row items-center">
                <Feather name="video" size={16} color={iconMuted} />
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
                  Studio
                </Text>
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">
                {animeData.studio}
              </Text>
            </View>

            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/50">
              <View className="flex-row items-center">
                <Feather name="book-open" size={16} color={iconMuted} />
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
                  Source
                </Text>
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">
                {animeData.source}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Feather name="calendar" size={16} color={iconMuted} />
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
                  Aired
                </Text>
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">
                {animeData.airedPeriod}
              </Text>
            </View>
          </View>

          {/* Genres Chips */}
          {animeData.genres && animeData.genres.length > 0 && (
            <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-3">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Genres & Themes
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {animeData.genres.map((genre) => (
                  <View
                    key={genre}
                    className="bg-slate-100 dark:bg-slate-700/80 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600"
                  >
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {genre}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Synopsis */}
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
              Synopsis
            </Text>
            <Text className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {animeData.description}
            </Text>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
