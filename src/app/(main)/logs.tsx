import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

interface MediaItem {
  id: string;
  title: string;
  currentEpisode: number;
  lastWatched: string;
}

const SAMPLE_DATA: MediaItem[] = [
  {
    id: "1",
    title: "Solo Leveling",
    currentEpisode: 12,
    lastWatched: "08/29/2026 10:45 AM",
  },
  {
    id: "2",
    title: "Frieren: Beyond Journey’s End",
    currentEpisode: 28,
    lastWatched: "08/25/2026 08:30 PM",
  },
  {
    id: "3",
    title: "Jujutsu Kaisen Season 2",
    currentEpisode: 18,
    lastWatched: "08/19/2026 09:15 PM",
  },
  {
    id: "4",
    title:
      "Though I Am an Inept Villainess: Tale of the Butterfly-Rat Body Swap in the Maiden Court",
    currentEpisode: 8,
    lastWatched: "08/15/2026 07:00 PM",
  },
  {
    id: "5",
    title:
      "Trapped in a Dating Sim: The World of Otome Games is Tough for Mobs 2nd Season",
    currentEpisode: 8,
    lastWatched: "08/31/2026 06:30 PM",
  },
];

export default function LogsScreen() {
  const router = useRouter();
  const [items] = useState<MediaItem[]>(SAMPLE_DATA);
  const [sortOrder, setSortOrder] = useState<"Newest First" | "Oldest First">(
    "Newest First",
  );

  const toggleSort = () => {
    setSortOrder((prev) =>
      prev === "Newest First" ? "Oldest First" : "Newest First",
    );
  };

  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.lastWatched).getTime();
    const timeB = new Date(b.lastWatched).getTime();

    if (sortOrder === "Newest First") {
      return timeB - timeA;
    } else {
      return timeA - timeB;
    }
  });

  useEffect(() => {
    async function requireAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
      }
    }
    requireAuth();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#ECE8FC]">
      <View className="flex-row items-center bg-white p-3 shadow-sm">
        <Feather name="list" size={16} color="#6B7280" />
        <Text className="text-[#6B7280] ml-2 text-sm font-medium">Logs</Text>
      </View>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="pt-4 pb-4">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/dashboard")}
            className="flex-row items-center mb-4"
          >
            <Ionicons name="arrow-back" size={18} color="#6D28D9" />
            <Text className="ml-1 text-sm font-semibold text-purple-700">
              Back
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-slate-500">
              Sort By:{" "}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleSort}
              className="flex-row items-center bg-purple-100 px-2 py-1 rounded"
            >
              <Text className="text-sm font-bold text-purple-700">
                {sortOrder}
              </Text>
              <Feather
                name={sortOrder === "Newest First" ? "arrow-down" : "arrow-up"}
                size={14}
                color="#6D28D9"
                className="ml-1"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-y-1">
          {sortedItems.map((item) => (
            <View
              key={item.id}
              className="bg-white border-slate-200 shadow-sm overflow-hidden"
            >
              <View className="flex-row items-center justify-between py-2 px-3 border-b border-slate-200">
                <View className="flex-1 pr-4">
                  <Text
                    className="text-sm font-bold text-slate-900"
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(`/title/${item.id}`)}
                  className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center"
                >
                  <Feather name="arrow-up-right" size={16} color="#6D28D9" />
                </TouchableOpacity>
              </View>

              <View className="flex-row border-b border-slate-200">
                <View className="flex-1 py-2 px-3 border-r border-slate-200 justify-center bg-slate-50/50">
                  <Text className="text-sm text-slate-500">
                    <Text className="font-bold text-purple-700">
                      Episode {item.currentEpisode}
                    </Text>
                    {" @ "}
                    <Text className="text-md font-bold text-slate-800">
                      {item.lastWatched}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
