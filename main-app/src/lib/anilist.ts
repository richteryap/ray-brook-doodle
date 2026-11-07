import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export interface AniListMediaData {
  id: number;
  englishTitle: string;
  nativeTitle: string;
  romajiTitle: string;
  description: string;
  episodes: number | null;
  status: string;
  airedPeriod: string;
  studio: string;
  source: string;
  genres: string[];
  coverImageUrl: string | null;
  format: string | null;
  season: string | null;
  seasonYear: number | null;
  premiered: string | null;
}

interface CacheEntry {
  data: AniListMediaData;
  lastVisited: number;
}

// 5 weeks in milliseconds: 5 weeks * 7 days * 24 hours * 60 mins * 60 secs * 1000 ms
const CACHE_TTL_MS = 5 * 7 * 24 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "@anilist_cache_";
const CACHE_INDEX_KEY = "@anilist_cache_index";
const FORMAT_CACHE_PREFIX = "@anilist_format_";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatAniListDate(dateObj: { year?: number; month?: number; day?: number } | null | undefined): string | null {
  if (!dateObj || !dateObj.year) return null;
  const month = dateObj.month ? MONTH_NAMES[dateObj.month - 1] : null;
  const day = dateObj.day ? `${dateObj.day}, ` : "";
  if (month) {
    return `${month} ${day}${dateObj.year}`;
  }
  return `${dateObj.year}`;
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return "Unknown";
  switch (status.toUpperCase()) {
    case "FINISHED":
      return "Finished Airing";
    case "RELEASING":
      return "Currently Airing";
    case "NOT_YET_RELEASED":
      return "Not Yet Aired";
    case "CANCELLED":
      return "Cancelled";
    case "HIATUS":
      return "On Hiatus";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
}

function formatSource(source: string | null | undefined): string {
  if (!source) return "Original";
  return source
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Standardizes title strings for consistent matching across AniList and scraped sites.
 * Normalizes unicode single quotes (’ ‘), grave accents (`), acute accents (´) to standard ASCII apostrophe ('),
 * collapses multiple spaces, and converts to lowercase.
 */
export function normalizeTitle(title: string | null | undefined): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[\u2018\u2019`´']/g, "'")
    .replace(/[\u201C\u201D"]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function formatFormat(rawFormat: string | null | undefined): string | null {
  if (!rawFormat) return null;
  switch (rawFormat.toUpperCase()) {
    case "TV":
      return "TV";
    case "TV_SHORT":
      return "TV Short";
    case "MOVIE":
      return "Movie";
    case "ONA":
      return "Ona";
    case "OVA":
      return "Ova";
    case "SPECIAL":
      return "Special";
    case "MUSIC":
      return "Music";
    default:
      return rawFormat.charAt(0).toUpperCase() + rawFormat.slice(1).toLowerCase();
  }
}

export function formatSeason(
  season: string | null | undefined,
  seasonYear: number | null | undefined,
  startDate?: { year?: number; month?: number } | null
): string | null {
  if (season && seasonYear) {
    const s = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
    return `${s} ${seasonYear}`;
  }
  const year = seasonYear || startDate?.year;
  if (!year) return null;
  if (startDate?.month) {
    const m = startDate.month;
    let s = "Winter";
    if (m >= 4 && m <= 6) s = "Spring";
    else if (m >= 7 && m <= 9) s = "Summer";
    else if (m >= 10 && m <= 12) s = "Fall";
    return `${s} ${year}`;
  }
  return `${year}`;
}

function cleanDescription(rawText: string | null | undefined): string {
  if (!rawText) return "No synopsis available.";
  return rawText
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Prunes expired entries from AsyncStorage
 */
async function pruneExpiredCache(): Promise<void> {
  try {
    const indexRaw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (!indexRaw) return;

    const ids: string[] = JSON.parse(indexRaw);
    const now = Date.now();
    const remainingIds: string[] = [];

    for (const id of ids) {
      const entryKey = `${CACHE_KEY_PREFIX}${id}`;
      const entryRaw = await AsyncStorage.getItem(entryKey);
      if (entryRaw) {
        try {
          const entry: CacheEntry = JSON.parse(entryRaw);
          if (now - entry.lastVisited < CACHE_TTL_MS) {
            remainingIds.push(id);
          } else {
            await AsyncStorage.removeItem(entryKey);
          }
        } catch {
          await AsyncStorage.removeItem(entryKey);
        }
      }
    }

    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(remainingIds));
  } catch (error) {
    console.warn("Failed to prune expired AniList cache:", error);
  }
}

async function recordCacheKey(id: string): Promise<void> {
  try {
    const indexRaw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    const ids: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!ids.includes(id)) {
      ids.push(id);
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(ids));
    }
  } catch (error) {
    console.warn("Failed to update cache index:", error);
  }
}

export type FetchTitleDetailsResult =
  | { success: true; data: AniListMediaData; isFromCache: boolean }
  | { success: false; error: "offline" | "not_found" | "failed"; message: string };

/**
 * Loads AniList details for a show with a 5-week rolling offline cache.
 * If cached, resets the 5-week expiration countdown.
 */
export async function getTitleDetails(
  showId: string,
  searchTitle: string,
  forceRefresh = false
): Promise<FetchTitleDetailsResult> {
  const cacheKey = `${CACHE_KEY_PREFIX}${showId}`;

  // 1. Check local cache first (offline-first)
  if (!forceRefresh) {
    try {
      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      if (cachedRaw) {
        const entry: CacheEntry = JSON.parse(cachedRaw);
        const age = Date.now() - entry.lastVisited;

        if (age < CACHE_TTL_MS) {
          // Reset countdown on access (rolling TTL)
          entry.lastVisited = Date.now();
          AsyncStorage.setItem(cacheKey, JSON.stringify(entry)).catch(() => {});

          return { success: true, data: entry.data, isFromCache: true };
        } else {
          // Cache expired
          AsyncStorage.removeItem(cacheKey).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Error reading title cache:", e);
    }
  }

  // 2. Cache miss or forced refresh: Check network
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    return {
      success: false,
      error: "offline",
      message: "You're offline. Connect to the internet to load details from AniList.",
    };
  }

  // 3. Fetch from AniList GraphQL (quote-resilient)
  try {
    const fetchAniListMedia = async (q: string) => {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: `
            query ($search: String) {
              Page(page: 1, perPage: 8) {
                media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
                  id
                  title {
                    english
                    native
                    romaji
                  }
                  description(asHtml: false)
                  episodes
                  status
                  format
                  season
                  seasonYear
                  startDate {
                    year
                    month
                    day
                  }
                  endDate {
                    year
                    month
                    day
                  }
                  studios(isMain: true) {
                    nodes {
                      name
                    }
                  }
                  source
                  genres
                  coverImage {
                    large
                  }
                }
              }
            }
          `,
          variables: { search: q },
        }),
      });

      if (!response.ok) return null;
      const json = await response.json();
      return (json?.data?.Page?.media as any[]) || [];
    };

    // 3a. Try query with standard ASCII apostrophes
    const asciiQuery = searchTitle.replace(/[\u2018\u2019`´]/g, "'").trim();
    let mediaList = await fetchAniListMedia(asciiQuery);

    // 3b. Fallback: If 0 results and title had quotes, try with curly apostrophes
    if ((!mediaList || mediaList.length === 0) && /['\u2018\u2019`´]/.test(searchTitle)) {
      const curlyQuery = searchTitle.replace(/['\u2018\u2019`´]/g, "’").trim();
      const fallbackList = await fetchAniListMedia(curlyQuery);
      if (fallbackList && fallbackList.length > 0) {
        mediaList = fallbackList;
      }
    }

    if (!mediaList || mediaList.length === 0) {
      return {
        success: false,
        error: "not_found",
        message: `Could not find anime matching "${searchTitle}" on AniList.`,
      };
    }

    // 3c. Match canonical media item using normalized titles
    const targetNorm = normalizeTitle(searchTitle);
    const exact = mediaList.find(
      (m: any) =>
        normalizeTitle(m.title?.english) === targetNorm ||
        normalizeTitle(m.title?.romaji) === targetNorm ||
        normalizeTitle(m.title?.native) === targetNorm
    );
    const media = exact || mediaList[0];

    const startStr = formatAniListDate(media.startDate);
    const endStr = formatAniListDate(media.endDate);
    let airedPeriod = "Broadcast dates unavailable";
    if (startStr && endStr) {
      airedPeriod = `${startStr} to ${endStr}`;
    } else if (startStr) {
      airedPeriod = `${startStr} to Present`;
    }

    const studioName = media.studios?.nodes?.[0]?.name || "Independent / Unknown";
    const formattedFormat = formatFormat(media.format);
    const premiered = formatSeason(media.season, media.seasonYear, media.startDate);

    const data: AniListMediaData = {
      id: media.id,
      englishTitle: media.title?.english || media.title?.romaji || searchTitle,
      nativeTitle: media.title?.native || "",
      romajiTitle: media.title?.romaji || "",
      description: cleanDescription(media.description),
      episodes: media.episodes || null,
      status: formatStatus(media.status),
      airedPeriod,
      studio: studioName,
      source: formatSource(media.source),
      genres: media.genres || [],
      coverImageUrl: media.coverImage?.large || null,
      format: formattedFormat,
      season: media.season
        ? media.season.charAt(0).toUpperCase() + media.season.slice(1).toLowerCase()
        : null,
      seasonYear: media.seasonYear || null,
      premiered,
    };

    // 4. Save to cache with rolling timestamp
    const entry: CacheEntry = {
      data,
      lastVisited: Date.now(),
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
    if (formattedFormat) {
      AsyncStorage.setItem(`${FORMAT_CACHE_PREFIX}${showId}`, formattedFormat).catch(() => {});
    }
    recordCacheKey(showId);

    // Prune expired cache in background
    pruneExpiredCache().catch(() => {});

    return { success: true, data, isFromCache: false };
  } catch (err: any) {
    return {
      success: false,
      error: "failed",
      message: err?.message || "Failed to communicate with AniList.",
    };
  }
}

export interface AniListSearchResult {
  id: number;
  title: string;
  romajiTitle: string;
  nativeTitle: string;
  coverImageUrl: string | null;
  episodes: number | null;
  format: string | null;
  seasonYear: number | null;
  status: string;
  rawStatus: string;
  isAddable: boolean;
}

export async function searchAnimeTitles(query: string): Promise<AniListSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return [];

  try {
    const fetchPage = async (q: string) => {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: `
            query ($search: String) {
              Page(page: 1, perPage: 8) {
                media(search: $search, type: ANIME, status_in: [RELEASING, FINISHED, HIATUS], sort: SEARCH_MATCH) {
                  id
                  title {
                    english
                    romaji
                    native
                  }
                  coverImage {
                    medium
                    large
                  }
                  episodes
                  format
                  seasonYear
                  status
                }
              }
            }
          `,
          variables: { search: q },
        }),
      });

      if (!response.ok) return [];
      const json = await response.json();
      return (json?.data?.Page?.media as any[]) || [];
    };

    const asciiQuery = trimmed.replace(/[\u2018\u2019`´]/g, "'").trim();
    let mediaList = await fetchPage(asciiQuery);

    if (mediaList.length === 0 && /['\u2018\u2019`´]/.test(trimmed)) {
      const curlyQuery = trimmed.replace(/['\u2018\u2019`´]/g, "’").trim();
      const fallbackList = await fetchPage(curlyQuery);
      if (fallbackList.length > 0) {
        mediaList = fallbackList;
      }
    }

    return mediaList.map((m: any) => {
      const rawStatus = (m.status || "").toUpperCase();
      const isAddable =
        rawStatus === "RELEASING" ||
        rawStatus === "FINISHED" ||
        rawStatus === "HIATUS";

      return {
        id: m.id,
        title: m.title?.english || m.title?.romaji || trimmed,
        romajiTitle: m.title?.romaji || "",
        nativeTitle: m.title?.native || "",
        coverImageUrl: m.coverImage?.medium || m.coverImage?.large || null,
        episodes: m.episodes || null,
        format: m.format || null,
        seasonYear: m.seasonYear || null,
        status: formatStatus(m.status),
        rawStatus,
        isAddable,
      };
    });
  } catch (err) {
    console.warn("AniList search error:", err);
    return [];
  }
}

export interface EpisodeAiringCheck {
  isAired: boolean;
  maxAiredEpisode: number | null;
  reason?: string;
}

/**
 * Checks whether a specific episode of an anime has actually aired.
 * Uses AniList's nextAiringEpisode schedule for ongoing shows and
 * total episodes count for finished anime.
 */
export async function checkEpisodeAired(
  searchTitle: string,
  targetEpisode: number
): Promise<EpisodeAiringCheck> {
  const trimmed = searchTitle.trim();
  if (!trimmed || targetEpisode <= 0) {
    return { isAired: true, maxAiredEpisode: null };
  }

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    return {
      isAired: false,
      maxAiredEpisode: null,
      reason:
        "No internet connection. Please connect to the internet to verify the episode release schedule before logging.",
    };
  }

  try {
    const fetchSchedule = async (q: string) => {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: `
            query ($search: String) {
              Page(page: 1, perPage: 8) {
                media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
                  id
                  title {
                    english
                    romaji
                  }
                  status
                  episodes
                  nextAiringEpisode {
                    episode
                    airingAt
                  }
                }
              }
            }
          `,
          variables: { search: q },
        }),
      });

      if (!response.ok) return null;
      const json = await response.json();
      return (json?.data?.Page?.media as any[]) || [];
    };

    const asciiQuery = trimmed.replace(/[\u2018\u2019`´]/g, "'").trim();
    let mediaList = await fetchSchedule(asciiQuery);

    if ((!mediaList || mediaList.length === 0) && /['\u2018\u2019`´]/.test(trimmed)) {
      const curlyQuery = trimmed.replace(/['\u2018\u2019`´]/g, "’").trim();
      const fallbackList = await fetchSchedule(curlyQuery);
      if (fallbackList && fallbackList.length > 0) {
        mediaList = fallbackList;
      }
    }

    if (!mediaList || mediaList.length === 0) {
      return { isAired: true, maxAiredEpisode: null };
    }

    const targetNorm = normalizeTitle(trimmed);
    const exact = mediaList.find(
      (m: any) =>
        normalizeTitle(m.title?.english) === targetNorm ||
        normalizeTitle(m.title?.romaji) === targetNorm
    );
    const media = exact || mediaList[0];

    const nowSeconds = Math.floor(Date.now() / 1000);

    // 1. If currently releasing with a scheduled next episode
    if (media.status === "RELEASING" && media.nextAiringEpisode) {
      const nextEp = media.nextAiringEpisode.episode;
      const airingAt = media.nextAiringEpisode.airingAt;

      // If next airing time is in the future, latest released is (nextEp - 1)
      const maxAired = airingAt > nowSeconds ? nextEp - 1 : nextEp;
      if (targetEpisode > maxAired) {
        return {
          isAired: false,
          maxAiredEpisode: maxAired,
          reason: `Episode ${targetEpisode} has not aired yet. The latest released episode is Episode ${maxAired}.`,
        };
      }
    }

    // 2. If finished or has total episodes limit
    if (media.episodes && targetEpisode > media.episodes) {
      return {
        isAired: false,
        maxAiredEpisode: media.episodes,
        reason: `Episode ${targetEpisode} exceeds total released episodes (${media.episodes}).`,
      };
    }

    // 3. If show status is NOT_YET_RELEASED
    if (media.status === "NOT_YET_RELEASED") {
      return {
        isAired: false,
        maxAiredEpisode: 0,
        reason: `This series has not started airing yet.`,
      };
    }

    return { isAired: true, maxAiredEpisode: media.episodes || null };
  } catch (err) {
    console.warn("AniList airing check error:", err);
    return {
      isAired: false,
      maxAiredEpisode: null,
      reason:
        "Unable to verify episode release schedule with AniList. Please check your internet connection.",
    };
  }
}

/**
 * Loads format types for multiple titles (e.g. for Library cards).
 * Checks local cache first (AsyncStorage), then fetches missing items from AniList.
 */
export async function getShowFormats(
  shows: { id: string; title: string }[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const missing: { id: string; title: string }[] = [];

  // 1. Check local caches first
  await Promise.all(
    shows.map(async (show) => {
      try {
        const formatKey = `${FORMAT_CACHE_PREFIX}${show.id}`;
        const cachedFormat = await AsyncStorage.getItem(formatKey);
        if (cachedFormat) {
          result[show.id] = cachedFormat;
          return;
        }

        const detailKey = `${CACHE_KEY_PREFIX}${show.id}`;
        const cachedDetailRaw = await AsyncStorage.getItem(detailKey);
        if (cachedDetailRaw) {
          const entry: CacheEntry = JSON.parse(cachedDetailRaw);
          if (entry.data?.format) {
            result[show.id] = entry.data.format;
            AsyncStorage.setItem(formatKey, entry.data.format).catch(() => {});
            return;
          }
        }

        missing.push(show);
      } catch {
        missing.push(show);
      }
    })
  );

  if (missing.length === 0) return result;

  // 2. Query missing in small batches from AniList
  const BATCH_SIZE = 4;
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (show) => {
        try {
          const fetchFormat = async (q: string) => {
            const response = await fetch("https://graphql.anilist.co", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                query: `
                  query ($search: String) {
                    Page(page: 1, perPage: 6) {
                      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
                        title {
                          english
                          romaji
                        }
                        format
                      }
                    }
                  }
                `,
                variables: { search: q },
              }),
            });
            if (!response.ok) return [];
            const json = await response.json();
            return (json?.data?.Page?.media as any[]) || [];
          };

          const asciiQuery = show.title.replace(/[\u2018\u2019`´]/g, "'").trim();
          let mediaList = await fetchFormat(asciiQuery);
          if (mediaList.length === 0 && /['\u2018\u2019`´]/.test(show.title)) {
            const curlyQuery = show.title.replace(/['\u2018\u2019`´]/g, "’").trim();
            const fallbackList = await fetchFormat(curlyQuery);
            if (fallbackList.length > 0) {
              mediaList = fallbackList;
            }
          }

          if (mediaList.length > 0) {
            const targetNorm = normalizeTitle(show.title);
            const exact = mediaList.find(
              (m: any) =>
                normalizeTitle(m.title?.english) === targetNorm ||
                normalizeTitle(m.title?.romaji) === targetNorm
            );
            const media = exact || mediaList[0];
            const rawFormat = media?.format;
            if (rawFormat) {
              const formatted = formatFormat(rawFormat);
              if (formatted) {
                result[show.id] = formatted;
                AsyncStorage.setItem(`${FORMAT_CACHE_PREFIX}${show.id}`, formatted).catch(() => {});
              }
            }
          }
        } catch {
          // Gracefully continue
        }
      })
    );
  }

  return result;
}
