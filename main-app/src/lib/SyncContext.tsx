import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { supabase } from "./supabase";
import { normalizeTitle } from "./anilist";

export type SyncStatus = "synced" | "syncing" | "offline" | "outdated";

interface SyncContextType {
  syncStatus: SyncStatus;
  lastSynced: Date | null;
  activeShows: any[];
  libraryShows: any[];
  logs: any[];
  syncWithCloud: () => Promise<void>;
  markAsOutdated: () => void;
  dropActiveShows: (ids: string[]) => Promise<void>;
  moveToLibrary: (ids: string[]) => Promise<void>;
  clearData: () => Promise<void>;
  manualLogEpisode: (
    showId: string,
    showName: string,
    newEpisode: number,
    logDate: Date
  ) => Promise<{
    success: boolean;
    logId: string;
    previousEpisode: number;
    previousDate: string;
  }>;
  undoManualLog: (
    showId: string,
    previousEpisode: number,
    previousDate: string,
    logId: string
  ) => Promise<void>;
  manualLogNewTitle: (
    title: string,
    totalEpisodes: number | null,
    logDate: Date
  ) => Promise<{
    success: boolean;
    showId: string;
    logId: string;
    isNewShow: boolean;
    previousEpisode?: number;
    previousDate?: string;
  }>;
  undoManualLogNewTitle: (
    showId: string,
    logId: string,
    isNewShow: boolean,
    previousEpisode?: number,
    previousDate?: string
  ) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [activeShows, setActiveShows] = useState<any[]>([]);
  const [libraryShows, setLibraryShows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function loadLocalData() {
      const cachedShows = await AsyncStorage.getItem("local_active_shows");
      const cachedLogs = await AsyncStorage.getItem("local_logs");
      const cachedSyncTime = await AsyncStorage.getItem("last_synced");
      const cachedLibrary = await AsyncStorage.getItem("local_library_shows");

      if (cachedShows) setActiveShows(JSON.parse(cachedShows));
      if (cachedLibrary) setLibraryShows(JSON.parse(cachedLibrary));
      if (cachedLogs) setLogs(JSON.parse(cachedLogs));
      if (cachedSyncTime) setLastSynced(new Date(cachedSyncTime));
    }
    loadLocalData();
  }, []);

  const syncWithCloud = useCallback(async () => {
    if (isSyncingRef.current) return;

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setSyncStatus("offline");
      return;
    }

    isSyncingRef.current = true;
    setSyncStatus("syncing");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        isSyncingRef.current = false;
        return;
      }

      const user = session.user;

      const [showsRes, logsRes] = await Promise.all([
        supabase
          .from("active_shows")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (showsRes.error) throw showsRes.error;
      if (logsRes.error) throw logsRes.error;

      const allShows = showsRes.data || [];

      const watching = allShows.filter((show) => !show.is_archived);
      const completed = allShows.filter((show) => show.is_archived);

      setActiveShows(watching);
      setLibraryShows(completed);
      setLogs(logsRes.data || []);

      const now = new Date();
      setLastSynced(now);

      await AsyncStorage.multiSet([
        ["local_active_shows", JSON.stringify(watching)],
        ["local_library_shows", JSON.stringify(completed)],
        ["local_logs", JSON.stringify(logsRes.data || [])],
        ["last_synced", now.toISOString()],
      ]);

      setSyncStatus("synced");
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus("offline");
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const clearData = async () => {
    setActiveShows([]);
    setLibraryShows([]);
    setLogs([]);
    setLastSynced(null);
    setSyncStatus("offline");

    await AsyncStorage.multiRemove([
      "local_active_shows",
      "local_library_shows",
      "local_logs",
      "last_synced",
    ]);
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncWithCloud();
      } else {
        setSyncStatus("offline");
      }
    });
    return () => unsubscribe();
  }, [syncWithCloud]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        syncWithCloud();
      }
    });
    return () => subscription.remove();
  }, [syncWithCloud]);

  useEffect(() => {
    let channel: any;

    function subscribeUser(userId: string) {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }

      channel = supabase
        .channel(`db-changes-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "logs",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            setSyncStatus("outdated");
            syncWithCloud();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "active_shows",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            setSyncStatus("outdated");
            syncWithCloud();
          },
        )
        .subscribe();
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        subscribeUser(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        subscribeUser(session.user.id);
        if (event === "SIGNED_IN") {
          syncWithCloud();
        }
      } else {
        if (channel) {
          supabase.removeChannel(channel);
          channel = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [syncWithCloud]);

  const markAsOutdated = useCallback(() => setSyncStatus("outdated"), []);

  const moveToLibrary = async (ids: string[]) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from("active_shows")
        .update({ is_archived: true })
        .eq("user_id", session.user.id)
        .in("id", ids);

      if (error) throw error;
      await syncWithCloud();
    } catch (error) {
      console.error("Error moving to library:", error);
    }
  };

  const dropActiveShows = async (ids: string[]) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from("active_shows")
        .delete()
        .eq("user_id", session.user.id)
        .in("id", ids);

      if (error) throw error;
      await syncWithCloud();
    } catch (error) {
      console.error("Error dropping shows:", error);
    }
  };

  const manualLogEpisode = async (
    showId: string,
    showName: string,
    newEpisode: number,
    logDate: Date
  ): Promise<{
    success: boolean;
    logId: string;
    previousEpisode: number;
    previousDate: string;
  }> => {
    const targetShow = activeShows.find((s) => s.id === showId);
    const previousEpisode = targetShow ? targetShow.latest_episode : newEpisode - 1;
    const previousDate = targetShow ? targetShow.updated_at : new Date().toISOString();
    const isoDate = logDate.toISOString();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("User not authenticated");

    const { error: showErr } = await supabase
      .from("active_shows")
      .update({
        latest_episode: newEpisode,
        updated_at: isoDate,
      })
      .eq("id", showId)
      .eq("user_id", session.user.id);

    if (showErr) throw showErr;

    const { data: logData, error: logErr } = await supabase
      .from("logs")
      .insert({
        user_id: session.user.id,
        raw_title: `${showName} Episode ${newEpisode}`,
        show_name: showName,
        episode: newEpisode,
        created_at: isoDate,
      })
      .select()
      .single();

    if (logErr) {
      if (
        logErr.code === "23505" ||
        logErr.message?.includes("unique_user_show_episode") ||
        logErr.message?.includes("duplicate key")
      ) {
        throw new Error(
          `Episode ${newEpisode} of "${showName}" has already been logged in your history.`
        );
      }
      throw logErr;
    }

    const logId = logData?.id || "temp-" + Date.now();

    const updatedActiveShows = activeShows.map((s) =>
      s.id === showId
        ? { ...s, latest_episode: newEpisode, updated_at: isoDate }
        : s
    );
    const newLogEntry = logData || {
      id: logId,
      user_id: session.user.id,
      raw_title: `${showName} Episode ${newEpisode}`,
      show_name: showName,
      episode: newEpisode,
      created_at: isoDate,
    };
    const updatedLogs = [newLogEntry, ...logs.filter((l) => l.id !== logId)];

    setActiveShows(updatedActiveShows);
    setLogs(updatedLogs);

    await AsyncStorage.multiSet([
      ["local_active_shows", JSON.stringify(updatedActiveShows)],
      ["local_logs", JSON.stringify(updatedLogs)],
    ]);

    return {
      success: true,
      logId,
      previousEpisode,
      previousDate,
    };
  };

  const undoManualLog = async (
    showId: string,
    previousEpisode: number,
    previousDate: string,
    logId: string
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error: showErr } = await supabase
        .from("active_shows")
        .update({
          latest_episode: previousEpisode,
          updated_at: previousDate,
        })
        .eq("id", showId)
        .eq("user_id", session.user.id);

      if (showErr) console.warn("Failed to revert active show in cloud:", showErr);

      if (logId && !logId.startsWith("temp-")) {
        const { error: logErr } = await supabase
          .from("logs")
          .delete()
          .eq("id", logId)
          .eq("user_id", session.user.id);

        if (logErr) console.warn("Failed to delete log from cloud:", logErr);
      }

      const revertedActiveShows = activeShows.map((s) =>
        s.id === showId
          ? { ...s, latest_episode: previousEpisode, updated_at: previousDate }
          : s
      );
      const revertedLogs = logs.filter((l) => l.id !== logId);

      setActiveShows(revertedActiveShows);
      setLogs(revertedLogs);

      await AsyncStorage.multiSet([
        ["local_active_shows", JSON.stringify(revertedActiveShows)],
        ["local_logs", JSON.stringify(revertedLogs)],
      ]);
    } catch (error) {
      console.error("Undo failed:", error);
    }
  };

  const manualLogNewTitle = async (
    title: string,
    totalEpisodes: number | null,
    logDate: Date
  ): Promise<{
    success: boolean;
    showId: string;
    logId: string;
    isNewShow: boolean;
    previousEpisode?: number;
    previousDate?: string;
  }> => {
    const isoDate = logDate.toISOString();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("User not authenticated");

    const existingShow = activeShows.find(
      (s) => normalizeTitle(s.show_name) === normalizeTitle(title)
    );

    let showId = "";
    let isNewShow = false;
    let previousEpisode: number | undefined;
    let previousDate: string | undefined;

    if (existingShow) {
      showId = existingShow.id;
      isNewShow = false;
      previousEpisode = existingShow.latest_episode;
      previousDate = existingShow.updated_at;

      const { error: showErr } = await supabase
        .from("active_shows")
        .update({
          latest_episode: 1,
          total_episodes: totalEpisodes ?? existingShow.total_episodes,
          updated_at: isoDate,
          is_archived: false,
        })
        .eq("id", showId)
        .eq("user_id", session.user.id);

      if (showErr) throw showErr;
    } else {
      isNewShow = true;
      const { data: newShowData, error: insertShowErr } = await supabase
        .from("active_shows")
        .insert({
          user_id: session.user.id,
          show_name: title,
          latest_episode: 1,
          total_episodes: totalEpisodes,
          updated_at: isoDate,
          is_archived: false,
        })
        .select()
        .single();

      if (insertShowErr) throw insertShowErr;
      showId = newShowData.id;
    }

    const { data: logData, error: logErr } = await supabase
      .from("logs")
      .insert({
        user_id: session.user.id,
        raw_title: `${title} Episode 1`,
        show_name: title,
        episode: 1,
        created_at: isoDate,
      })
      .select()
      .single();

    if (logErr) {
      if (
        logErr.code === "23505" ||
        logErr.message?.includes("unique_user_show_episode") ||
        logErr.message?.includes("duplicate key")
      ) {
        throw new Error(
          `Episode 1 of "${title}" has already been logged. This series is already in your watch history.`
        );
      }
      throw logErr;
    }

    const logId = logData?.id || "temp-" + Date.now();

    let updatedActiveShows: any[];
    if (isNewShow) {
      const newShow = {
        id: showId,
        user_id: session.user.id,
        show_name: title,
        latest_episode: 1,
        total_episodes: totalEpisodes,
        updated_at: isoDate,
        is_archived: false,
      };
      updatedActiveShows = [newShow, ...activeShows];
    } else {
      updatedActiveShows = activeShows.map((s) =>
        s.id === showId
          ? {
              ...s,
              latest_episode: 1,
              total_episodes: totalEpisodes ?? s.total_episodes,
              updated_at: isoDate,
              is_archived: false,
            }
          : s
      );
    }

    const newLogEntry = logData || {
      id: logId,
      user_id: session.user.id,
      raw_title: `${title} Episode 1`,
      show_name: title,
      episode: 1,
      created_at: isoDate,
    };
    const updatedLogs = [newLogEntry, ...logs.filter((l) => l.id !== logId)];

    setActiveShows(updatedActiveShows);
    setLogs(updatedLogs);

    await AsyncStorage.multiSet([
      ["local_active_shows", JSON.stringify(updatedActiveShows)],
      ["local_logs", JSON.stringify(updatedLogs)],
    ]);

    return {
      success: true,
      showId,
      logId,
      isNewShow,
      previousEpisode,
      previousDate,
    };
  };

  const undoManualLogNewTitle = async (
    showId: string,
    logId: string,
    isNewShow: boolean,
    previousEpisode?: number,
    previousDate?: string
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      if (isNewShow) {
        const { error: delErr } = await supabase
          .from("active_shows")
          .delete()
          .eq("id", showId)
          .eq("user_id", session.user.id);

        if (delErr) console.warn("Failed to delete new show in undo:", delErr);
      } else if (previousEpisode !== undefined && previousDate !== undefined) {
        const { error: updErr } = await supabase
          .from("active_shows")
          .update({
            latest_episode: previousEpisode,
            updated_at: previousDate,
          })
          .eq("id", showId)
          .eq("user_id", session.user.id);

        if (updErr) console.warn("Failed to revert show in undo:", updErr);
      }

      if (logId && !logId.startsWith("temp-")) {
        const { error: logErr } = await supabase
          .from("logs")
          .delete()
          .eq("id", logId)
          .eq("user_id", session.user.id);

        if (logErr) console.warn("Failed to delete log in undo:", logErr);
      }

      let revertedActiveShows: any[];
      if (isNewShow) {
        revertedActiveShows = activeShows.filter((s) => s.id !== showId);
      } else {
        revertedActiveShows = activeShows.map((s) =>
          s.id === showId
            ? {
                ...s,
                latest_episode: previousEpisode ?? s.latest_episode,
                updated_at: previousDate ?? s.updated_at,
              }
            : s
        );
      }
      const revertedLogs = logs.filter((l) => l.id !== logId);

      setActiveShows(revertedActiveShows);
      setLogs(revertedLogs);

      await AsyncStorage.multiSet([
        ["local_active_shows", JSON.stringify(revertedActiveShows)],
        ["local_logs", JSON.stringify(revertedLogs)],
      ]);
    } catch (error) {
      console.error("Undo title logging failed:", error);
    }
  };

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        lastSynced,
        activeShows,
        libraryShows,
        logs,
        syncWithCloud,
        markAsOutdated,
        dropActiveShows,
        moveToLibrary,
        clearData,
        manualLogEpisode,
        undoManualLog,
        manualLogNewTitle,
        undoManualLogNewTitle,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}
