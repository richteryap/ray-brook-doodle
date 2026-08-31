import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AccountScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#ECE8FC]">
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="pt-4 pb-4">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={18} color="#6D28D9" />
            <Text className="ml-1 text-sm font-semibold text-purple-700">
              Back
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl p-6 items-center shadow-sm border border-purple-100/60 mb-2">
          <View className="w-20 h-20 rounded-full bg-purple-100 items-center justify-center mb-4">
            <Feather name="user" size={32} color="#6D28D9" />
          </View>
          <Text className="text-xl font-bold text-slate-900">
            Richter Anthony
          </Text>
        </View>

        <View className="gap-y-2">
          <View className="bg-white rounded-2xl p-2 shadow-sm border border-purple-100/60">
            <Text className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Account
            </Text>

            <TouchableOpacity className="flex-row items-center justify-between px-4 py-3 border-b border-slate-50">
              <View className="flex-row items-center">
                <Feather name="at-sign" size={18} color="#64748b" />
                <Text className="ml-3 text-sm font-medium text-slate-700">
                  Username
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between px-4 py-3 border-b border-slate-50">
              <View className="flex-row items-center">
                <Feather name="mail" size={18} color="#64748b" />
                <Text className="ml-3 text-sm font-medium text-slate-700">
                  Email Address
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center">
                <Feather name="lock" size={18} color="#64748b" />
                <Text className="ml-3 text-sm font-medium text-slate-700">
                  Change Password
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl p-2 shadow-sm border border-purple-100/60">
            <Text className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Preferences
            </Text>

            <TouchableOpacity className="flex-row items-center justify-between px-4 py-3 border-b border-slate-50">
              <View className="flex-row items-center">
                <Feather name="moon" size={18} color="#64748b" />
                <Text className="ml-3 text-sm font-medium text-slate-700">
                  Dark Mode
                </Text>
              </View>
              <Text className="text-xs font-bold text-slate-400">Off</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center">
                <Feather name="database" size={18} color="#64748b" />
                <Text className="ml-3 text-sm font-medium text-slate-700">
                  Export Data
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace("/login")}
            className="mt-1 bg-red-50 py-4 rounded-xl border border-red-100 items-center justify-center flex-row"
          >
            <Feather name="log-out" size={18} color="#ef4444" />
            <Text className="ml-2 text-sm font-bold text-red-500">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
