import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  require("react-native-url-polyfill/auto");
}

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1.*$/, "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or Anon Key. Check your .env file.");
}

const customStorage = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve(null);
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve();
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve();
      window.localStorage.removeItem(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function isNetworkError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === "string" ? error : error.message || "";
  const lower = msg.toLowerCase();
  return (
    lower.includes("network request failed") ||
    lower.includes("fetch failed") ||
    lower.includes("unknownhostexception") ||
    lower.includes("unable to resolve host") ||
    lower.includes("failed to connect") ||
    lower.includes("no address associated with hostname") ||
    lower.includes("networkerror") ||
    lower.includes("failed to fetch")
  );
}

export async function hasOfflineAuth(error?: any): Promise<boolean> {
  try {
    const cachedUsername = await AsyncStorage.getItem("cached_username");
    if (!cachedUsername) return false;

    const net = await NetInfo.fetch();
    return !net.isConnected || isNetworkError(error);
  } catch {
    return false;
  }
}

export function formatAuthError(error: any): string {
  if (!error) return "";
  const msg = typeof error === "string" ? error : error.message || "";
  const lower = msg.toLowerCase();

  if (isNetworkError(error)) {
    return "No internet connection. Please check your network and try again.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please check your inbox and verify your email address.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email address already exists.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please try again in a few minutes.";
  }

  return msg;
}
