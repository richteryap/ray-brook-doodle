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

export type SyncStatus = "synced" | "syncing" | "offline" | "outdated";

interface SyncContextType {
  syncStatus: SyncStatus;
  lastSynced: Date | null;
  activeShows: any[];
  logs: any[];
  syncWithCloud: () => Promise<void>;
  markAsOutdated: () => void;
  dropActiveShows: (ids: string[]) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [activeShows, setActiveShows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function loadLocalData() {
      const cachedShows = await AsyncStorage.getItem("local_active_shows");
      const cachedLogs = await AsyncStorage.getItem("local_logs");
      const cachedSyncTime = await AsyncStorage.getItem("last_synced");

      if (cachedShows) setActiveShows(JSON.parse(cachedShows));
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
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSyncStatus("offline");
        isSyncingRef.current = false;
        return;
      }

      const [showsRes, logsRes] = await Promise.all([
        supabase.from("active_shows").select("*").eq("user_id", user.id),
        supabase.from("logs").select("*").eq("user_id", user.id),
      ]);

      if (showsRes.error) throw showsRes.error;
      if (logsRes.error) throw logsRes.error;

      setActiveShows(showsRes.data || []);
      setLogs(logsRes.data || []);

      const now = new Date();
      setLastSynced(now);

      await AsyncStorage.multiSet([
        ["local_active_shows", JSON.stringify(showsRes.data || [])],
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
    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel("db-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "logs" },
          () => {
            setSyncStatus("outdated");
            syncWithCloud();
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "active_shows" },
          () => {
            setSyncStatus("outdated");
            syncWithCloud();
          },
        )
        .subscribe();
    }

    setupRealtime();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [syncWithCloud]);

  const markAsOutdated = useCallback(() => setSyncStatus("outdated"), []);

  const dropActiveShows = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('active_shows')
        .delete()
        .in('id', ids);

      if (error) throw error;
      
      syncWithCloud();
    } catch (error) {
      console.error("Error dropping shows:", error);
    }
  };

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        lastSynced,
        activeShows,
        logs,
        syncWithCloud,
        markAsOutdated,
        dropActiveShows,
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
