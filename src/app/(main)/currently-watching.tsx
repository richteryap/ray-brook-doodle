import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MediaItem {
  id: string;
  title: string;
  currentEpisode: number;
  totalEpisodes: number;
  lastWatched: string;
}

const SAMPLE_DATA: MediaItem[] = [
  {
    id: "1",
    title: "Solo Leveling",
    currentEpisode: 12,
    totalEpisodes: 24,
    lastWatched: "08/29/2026 10:45 AM",
  },
  {
    id: "2",
    title: "Frieren: Beyond Journey’s End",
    currentEpisode: 5,
    totalEpisodes: 28,
    lastWatched: "08/25/2026 08:30 PM",
  },
  {
    id: "3",
    title: "Jujutsu Kaisen Season 2",
    currentEpisode: 18,
    totalEpisodes: 24,
    lastWatched: "08/19/2026 09:15 PM",
  },
  {
    id: "4",
    title:
      "Though I Am an Inept Villainess: Tale of the Butterfly-Rat Body Swap in the Maiden Court",
    currentEpisode: 8,
    totalEpisodes: 12,
    lastWatched: "08/15/2026 07:00 PM",
  },
  {
    id: "5",
    title:
      "Trapped in a Dating Sim: The World of Otome Games is Tough for Mobs 2nd Season",
    currentEpisode: 8,
    totalEpisodes: 12,
    lastWatched: "08/31/2026 06:30 PM",
  },
];

export default function CurrentlyWatchingScreen() {
  const router = useRouter();
  const [items] = useState<MediaItem[]>(SAMPLE_DATA);
  const [sortOrder, setSortOrder] = useState<"Chronological" | "Alphabetical">(
    "Chronological",
  );

  const toggleSort = () => {
    setSortOrder((prev) =>
      prev === "Chronological" ? "Alphabetical" : "Chronological",
    );
  };

  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.lastWatched).getTime();
    const timeB = new Date(b.lastWatched).getTime();

    if (sortOrder === "Chronological") {
      return timeB - timeA;
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-[#ECE8FC]">
      <View className="flex-row items-center bg-white p-3 shadow-sm">
        <Feather name="play-circle" size={16} color="black" />
        <Text className="text-[#6B7280] ml-2 text-sm font-medium">
          Currently Watching
        </Text>
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
                name={sortOrder === "Chronological" ? "arrow-down" : "arrow-up"}
                size={14}
                color="#6D28D9"
                className="ml-1"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-y-1">
          {sortedItems.map((item) => {
            const isCompleted = item.currentEpisode === item.totalEpisodes;
            return (
              <View
                key={item.id}
                className="relative bg-white border-slate-200 shadow-sm overflow-hidden"
              >
                <View
                  className={`absolute top-0 left-0 px-4 py-0 rounded-br-xl z-10 ${
                    isCompleted ? "bg-emerald-500" : "bg-cyan-500"
                  }`}
                >
                  <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                    {isCompleted ? "Completed" : "Watching"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between pt-3 pb-1 px-3 border-b border-slate-200">
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
                  <View className="flex-1 py-1 px-3 border-r border-slate-200 justify-center bg-slate-50/50">
                    <Text className="text-sm font-bold text-slate-700">
                      Episode {item.currentEpisode} out of {item.totalEpisodes}{" "}
                      Total Episodes
                    </Text>
                  </View>
                </View>

                <View className="flex-row">
                  <View className="flex-1 py-2 px-3 justify-center bg-slate-50/50">
                    <Text className="text-xs font-bold text-slate-800">
                      Last Watched: {item.lastWatched}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
