import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function HowToUseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#f8fafc" : "#0f172a";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";

  useEffect(() => {
    async function requireAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      }
    }
    requireAuth();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Top Header */}
      <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 px-4 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <View className="flex-row items-center">
          <Ionicons
            name="help-circle"
            size={24}
            color="#FBBF24"
          />
          <Text className="text-slate-900 dark:text-white ml-2.5 text-lg font-bold">
            How to Use
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/account")}
          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 flex-row items-center"
        >
          <Feather name="key" size={14} color={iconMuted} />
          <Text className="ml-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            Get Key
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Navigation Back */}
        <View className="pt-4 pb-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/dashboard");
              }
            }}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={18} color={primaryColor} />
            <Text className="ml-1 text-sm font-semibold text-slate-900 dark:text-white">
              Back
            </Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Hero Card */}
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <Text className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
            Welcome to Ray Brook 🎬
          </Text>
          <Text className="text-sm leading-5 text-slate-600 dark:text-slate-300">
            A media stream tracker and logging ecosystem. Log episodes directly
            from your browser and sync your watchlist in real time across mobile
            and web.
          </Text>
        </View>

        {/* Section 1: Browser Extension */}
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              Browser Extension
            </Text>
            <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
              <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Recommended
              </Text>
            </View>
          </View>

          {/* Pin Extension Callout */}
          <View className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 rounded-xl p-3.5 mb-4 flex-row items-start">
            <Ionicons name="pin" size={18} color="#f59e0b" className="mt-0.5" />
            <View className="ml-2.5 flex-1">
              <Text className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-0.5">
                Pin to Your Toolbar
              </Text>
              <Text className="text-xs leading-4 text-amber-800/90 dark:text-amber-200/80">
                After installing, click the puzzle icon (🧩) in your browser and
                click the pin button next to Ray Brook so it's always ready while streaming.
              </Text>
            </View>
          </View>

          {/* Steps */}
          <View className="space-y-3.5 gap-y-3.5">
            {/* Step 1 */}
            <View className="flex-row items-start">
              <View className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white items-center justify-center mr-3 mt-0.5">
                <Text className="text-xs font-bold text-white dark:text-slate-900">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Copy Your Secret API Key
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  Navigate to Account → Developer Settings and tap "Reveal" to copy your secret key.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push("/account")}
                  className="mt-2 self-start px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 flex-row items-center"
                >
                  <Text className="text-xs font-semibold text-slate-900 dark:text-white mr-1">
                    Open Account Settings
                  </Text>
                  <Feather name="arrow-up-right" size={12} color={primaryColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 2 */}
            <View className="flex-row items-start">
              <View className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white items-center justify-center mr-3 mt-0.5">
                <Text className="text-xs font-bold text-white dark:text-slate-900">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Install the Extension
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  • <Text className="font-semibold text-slate-700 dark:text-slate-300">Chrome / Brave / Edge:</Text> Download .zip, go to chrome://extensions, enable Developer mode, and click "Load unpacked".{"\n"}
                  • <Text className="font-semibold text-slate-700 dark:text-slate-300">Zen Browser / Firefox:</Text> Download .xpi, go to about:addons, click ⚙️ → "Install Add-on From File...".
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View className="flex-row items-start">
              <View className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white items-center justify-center mr-3 mt-0.5">
                <Text className="text-xs font-bold text-white dark:text-slate-900">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Save Your Key
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  Click your pinned Ray Brook icon, paste your API key into the field, and click "Save Key".
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View className="flex-row items-start">
              <View className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white items-center justify-center mr-3 mt-0.5">
                <Text className="text-xs font-bold text-white dark:text-slate-900">4</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Stream & Log With 1 Click
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  While streaming on a supported page, open the extension and click "Log Episode". Title, episode, and total episodes via AniList are beamed to your cloud.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Bookmarklet */}
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              Bookmarklet
            </Text>
            <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
              <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Universal
              </Text>
            </View>
          </View>

          <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mb-4">
            A single-click bookmark shortcut that logs episodes from any browser (desktop or mobile) without installing extensions.
          </Text>

          <View className="space-y-3 gap-y-3">
            <View className="flex-row items-start">
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-2">1.</Text>
              <Text className="flex-1 text-xs leading-4 text-slate-600 dark:text-slate-300">
                Create a new bookmark in your browser and name it <Text className="font-bold text-slate-900 dark:text-white">Log Ray Brook</Text>.
              </Text>
            </View>

            <View className="flex-row items-start">
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-2">2.</Text>
              <Text className="flex-1 text-xs leading-4 text-slate-600 dark:text-slate-300">
                Copy the snippet from <Text className="font-mono text-slate-900 dark:text-white">bookmarklet.txt</Text> and replace <Text className="font-mono text-slate-900 dark:text-white">'YOUR_SECRET_PROFILE_API_KEY'</Text> with your actual key.
              </Text>
            </View>

            <View className="flex-row items-start">
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-2">3.</Text>
              <Text className="flex-1 text-xs leading-4 text-slate-600 dark:text-slate-300">
                Paste the code into the bookmark URL field and save. Click it anytime while watching an episode to beam your progress.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Features */}
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-2 shadow-sm border border-slate-200 dark:border-slate-700">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Features
          </Text>

          <View className="gap-y-4">
            {/* Feature: Public Watchlist */}
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3 mt-0.5">
                <Ionicons name="globe-outline" size={18} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Public Watchlist (No Login Required)
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  Share your 8-digit Public UID with friends. Anyone can visit <Text className="font-mono text-slate-700 dark:text-slate-200">raybrook.vercel.app/u/&lt;uid&gt;</Text> to see your live watchlist without an account or login.
                </Text>
              </View>
            </View>

            {/* Feature: Currently Watching */}
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/10 items-center justify-center mr-3 mt-0.5">
                <Ionicons name="play-circle" size={18} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Currently Watching
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  Track in-progress shows, sort chronologically or alphabetically, and use multi-select bulk actions to move completed series to Library or Drop them.
                </Text>
              </View>
            </View>

            {/* Feature: Library */}
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-500/10 items-center justify-center mr-3 mt-0.5">
                <Ionicons name="library" size={18} color="#2dd4bf" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Library
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  Alphabetical cloud archive of all completed and saved shows with pull-to-refresh sync.
                </Text>
              </View>
            </View>

            {/* Feature: Logs */}
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 items-center justify-center mr-3 mt-0.5">
                <Ionicons name="list" size={18} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Logs
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete chronological audit ledger of every episode streamed with exact timestamps and episode counts.
                </Text>
              </View>
            </View>

            {/* Feature: Cloud Sync & Offline */}
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3 mt-0.5">
                <Ionicons name="cloud-done-outline" size={18} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-Time Sync & Offline Cache
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant synchronization backed by Supabase with live status indicators (Synced, Syncing, Outdated, Offline) and local persistence.
                </Text>
              </View>
            </View>

            {/* Feature: Data Export & Security */}
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3 mt-0.5">
                <Feather name="shield" size={16} color={iconMuted} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  Data Ownership & Security
                </Text>
                <Text className="text-xs leading-4 text-slate-500 dark:text-slate-400 mt-0.5">
                  Export your full streaming records and active shows to CSV anytime from Account, and instantly regenerate your secret API key if compromised.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
