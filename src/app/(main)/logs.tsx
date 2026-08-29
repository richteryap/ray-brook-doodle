import { Feather, Ionicons } from "@expo/vector-icons";
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
  totalEpisodes: number | string;
  lastWatched: string;
}

const SAMPLE_DATA: MediaItem[] = [
  {
    id: "1",
    title: "Solo Leveling",
    currentEpisode: 12,
    totalEpisodes: 12,
    lastWatched: "08/29/2026 10:45 AM",
  },
  {
    id: "2",
    title: "Frieren: Beyond Journey’s End",
    currentEpisode: 28,
    totalEpisodes: 28,
    lastWatched: "08/25/2026 08:30 PM",
  },
  {
    id: "3",
    title: "Jujutsu Kaisen Season 2",
    currentEpisode: 18,
    totalEpisodes: 23,
    lastWatched: "08/19/2026 09:15 PM",
  },
];

export default function LogsScreen() {
  const [items] = useState<MediaItem[]>(SAMPLE_DATA);

  return (
    <SafeAreaView className="flex-1 bg-[#ECE8FC]">
      {/* Top App Bar */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-purple-100">
        <View className="w-10 h-10 rounded-xl bg-purple-600 items-center justify-center">
          <Feather name="layers" size={22} color="white" />
        </View>
        <TouchableOpacity activeOpacity={0.7} className="p-2">
          <Feather name="menu" size={24} color="#4C1D95" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Navigation & Sort Controls */}
        <View className="pt-4 pb-3">
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center mb-3"
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
              className="flex-row items-center"
            >
              <Text className="text-sm font-bold text-purple-700">
                Last Watched
              </Text>
              <Feather
                name="chevron-down"
                size={16}
                color="#6D28D9"
                className="ml-1"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Cards List */}
        <View className="gap-y-4">
          {items.map((item) => (
            <View
              key={item.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100/60"
            >
              {/* Row 1: Title */}
              <View className="pb-3 border-b border-slate-100">
                <Text className="text-xl font-bold text-slate-900">
                  {item.title}
                </Text>
              </View>

              {/* Data Rows */}
              <View className="py-2 gap-y-2.5">
                {/* Row 2: Current Episode */}
                <View className="flex-row items-center justify-between py-1 border-b border-slate-50">
                  <Text className="text-sm font-medium text-slate-500">
                    Current Episode
                  </Text>
                  <Text className="text-sm font-semibold text-slate-800">
                    {item.currentEpisode}
                  </Text>
                </View>

                {/* Row 3: Number of Episodes */}
                <View className="flex-row items-center justify-between py-1 border-b border-slate-50">
                  <Text className="text-sm font-medium text-slate-500">
                    Number of Episodes
                  </Text>
                  <Text className="text-sm font-semibold text-slate-800">
                    {item.totalEpisodes}
                  </Text>
                </View>

                {/* Row 4: Last Watched Date and Time */}
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-sm font-medium text-slate-500">
                    Last Watched
                  </Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    {item.lastWatched}
                  </Text>
                </View>
              </View>

              {/* Bottom Action Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                className="mt-3 w-full py-2.5 rounded-lg border border-purple-300 items-center justify-center bg-purple-50/30 active:bg-purple-100"
              >
                <Text className="text-xs font-semibold text-purple-800">
                  View Details
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
