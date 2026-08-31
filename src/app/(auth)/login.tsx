import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
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
            <View className="w-16 h-16 rounded-2xl bg-purple-50 items-center justify-center overflow-hidden mb-4">
              <Image
                source={require("../../../assets/images/logo.png")}
                className="w-10 h-10 object-contain"
              />
            </View>
            <Text className="text-3xl font-bold text-slate-900">Login</Text>
          </View>

          <View className="mb-6">
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

          <View className="mb-6">
            <Text className="text-sm font-semibold text-slate-500 mb-1">
              Password
            </Text>
            <View className="flex-row items-center border-b border-slate-300">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                className="flex-1 text-base text-slate-900 py-2 outline-none"
                placeholder="Enter your password"
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

          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center"
            >
              <Feather
                name={rememberMe ? "check-square" : "square"}
                size={18}
                color={rememberMe ? "#6D28D9" : "#94a3b8"}
              />
              <Text className="ml-2 text-sm font-medium text-slate-600">
                Remember Me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-sm font-bold text-purple-700">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogin}
            className="w-full bg-purple-600 py-4 rounded-full items-center justify-center shadow-sm"
          >
            <Text className="text-white text-base font-bold">Log in</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-slate-500">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text className="text-sm font-bold text-purple-700">
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
