import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-purple-100">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center overflow-hidden">
            <Image
              source={require("../../../assets/images/logo.png")}
              className="w-full h-full object-contain"
            />
          </View>
          <Text className="text-[#6B7280] ml-3 text-lg font-medium">
            Richter Anthony
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/account")}
          className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center border border-purple-200"
        >
          <Feather name="user" size={20} color="#6D28D9" />
        </TouchableOpacity>
      </View>
      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center bg-white p-3.5 rounded-lg shadow-sm mb-4">
          <Ionicons name="home" size={16} color="#6B7280" />
          <Text className="text-[#6B7280] ml-2 text-sm font-medium">
            Dashboard
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4 pb-10">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/currently-watching")}
            className="w-[48%] h-44 bg-[#EF4444] rounded-3xl p-4 justify-between shadow-sm"
          >
            <View className="items-center justify-center flex-1">
              <Ionicons name="play-circle" size={64} color="white" />
            </View>
            <Text className="text-white font-medium text-sm">
              Currently Watching
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/library")}
            className="w-[48%] h-44 bg-[#2DD4BF] rounded-3xl p-4 justify-between shadow-sm"
          >
            <View className="items-center justify-center flex-1">
              <Ionicons name="library" size={56} color="white" />
            </View>
            <Text className="text-white font-medium text-sm">Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/logs")}
            className="w-[48%] h-44 bg-[#8B5CF6] rounded-3xl p-4 justify-between shadow-sm"
          >
            <View className="items-center justify-center flex-1">
              <Feather name="list" size={60} color="white" />
            </View>
            <Text className="text-white font-medium text-sm">Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/how-to-use")}
            className="w-[48%] h-44 bg-[#FBBF24] rounded-3xl p-4 justify-between shadow-sm"
          >
            <View className="items-center justify-center flex-1">
              <Ionicons name="help-circle" size={64} color="white" />
            </View>
            <Text className="text-white font-medium text-sm">How to use</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
