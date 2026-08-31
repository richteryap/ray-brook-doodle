import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = () => {
    router.replace("/dashboard");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#ECE8FC]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center items-center p-5"
      >
        <View className="w-full max-w-sm bg-white p-7 rounded-[32px] shadow-sm border border-purple-100">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-slate-900 mb-2">
              Register
            </Text>
            <Text className="text-sm text-slate-500 text-center">
              Create an account to track your watchlist.
            </Text>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-slate-500 mb-1">
              Username
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              className="text-base text-slate-900 py-2 border-b border-slate-300 outline-none"
              placeholder="Choose a username"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-slate-500 mb-1">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="text-base text-slate-900 py-2 border-b border-slate-300 outline-none"
              placeholder="Enter your email"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-8">
            <Text className="text-sm font-semibold text-slate-500 mb-1">
              Password
            </Text>
            <View className="flex-row items-center border-b border-slate-300">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                className="flex-1 text-base text-slate-900 py-2 outline-none"
                placeholder="Create a password"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowPassword(!showPassword)}
                className="p-2"
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={18}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRegister}
            className="w-full bg-purple-600 py-4 rounded-full items-center justify-center shadow-sm"
          >
            <Text className="text-white text-base font-bold">
              Create Account
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-slate-500">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text className="text-sm font-bold text-purple-700">Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
