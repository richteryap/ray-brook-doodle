import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

interface SyncContextType {
  isSyncing: boolean;
  lastSynced: Date | null;
  activeShows: any[];
  logs: any[];
  syncWithCloud: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [activeShows, setActiveShows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadLocalData() {
      const cachedShows = await AsyncStorage.getItem("local_active_shows");
      const cachedLogs = await AsyncStorage.getItem("local_logs");
      const cachedSyncTime = await AsyncStorage.getItem("last_synced");

      if (cachedShows) setActiveShows(JSON.parse(cachedShows));
      if (cachedLogs) setLogs(JSON.parse(cachedLogs));
      if (cachedSyncTime) setLastSynced(new Date(cachedSyncTime));

      syncWithCloud();
    }
    loadLocalData();
  }, []);

  const syncWithCloud = async () => {
    setIsSyncing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [showsRes, logsRes] = await Promise.all([
        supabase.from("active_shows").select("*").eq("user_id", user.id),
        supabase.from("logs").select("*").eq("user_id", user.id),
      ]);

      if (showsRes.error) throw showsRes.error;
      if (logsRes.error) throw logsRes.error;

      // Update State
      setActiveShows(showsRes.data || []);
      setLogs(logsRes.data || []);

      const now = new Date();
      setLastSynced(now);

      // Save to Offline Cache
      await AsyncStorage.multiSet([
        ["local_active_shows", JSON.stringify(showsRes.data || [])],
        ["local_logs", JSON.stringify(logsRes.data || [])],
        ["last_synced", now.toISOString()],
      ]);
    } catch (error) {
      console.error("Sync failed. Staying offline.", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider
      value={{ isSyncing, lastSynced, activeShows, logs, syncWithCloud }}
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
