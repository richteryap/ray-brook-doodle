import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import * as Linking from 'expo-linking';

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    setHasSubmitted(true);
    setAuthError("");
    setAuthSuccess("");

    if (!email || !password || !confirmPassword) {
      return;
    }

    if (password !== confirmPassword) {
      setAuthError(
        "Passwords do not match. Please ensure both passwords are exactly the same.",
      );
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setAuthError(
        "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.",
      );
      return;
    }

    setLoading(true);

    const redirectUrl = Linking.createURL('/');

    const metadata =
      username.trim() !== "" ? { username: username.trim() } : {};

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("User already registered")) {
        setAuthError("An account with this email address already exists.");
      } else {
        setAuthError(error.message);
      }
    } else if (data.session === null) {
      setAuthSuccess(
        "Account created! Please check your inbox to verify your email address.",
      );
    } else {
      router.replace("/dashboard");
    }
  };

  return (
    <SafeAreaView className="flex-1 w-full h-full bg-slate-50 dark:bg-slate-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 w-full h-full justify-center items-center p-5 bg-slate-50 dark:bg-slate-900"
      >
        <View className="w-full max-w-sm bg-white dark:bg-slate-800 p-7 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-700">
          <View className="items-center mb-6">
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Register
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
              Create an account to track your watchlist.
            </Text>
          </View>

          {authError ? (
            <View className="bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20 mb-4 flex-row items-center">
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text className="ml-2 text-sm text-red-600 dark:text-red-400 flex-1">
                {authError}
              </Text>
            </View>
          ) : null}

          {authSuccess ? (
            <View className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20 mb-4 flex-row items-center">
              <Feather name="check-circle" size={16} color="#10b981" />
              <Text className="ml-2 text-sm text-emerald-600 dark:text-emerald-400 flex-1">
                {authSuccess}
              </Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Username{" "}
              <Text className="text-slate-400 dark:text-slate-500 font-normal">
                (Optional)
              </Text>
            </Text>
            <TextInput
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setAuthError("");
                setAuthSuccess("");
              }}
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
              className="text-base text-slate-900 dark:text-white py-2 border-b border-slate-300 dark:border-slate-600 outline-none bg-transparent"
              placeholder="Choose a username"
              placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Email
              {hasSubmitted && !email && (
                <Text className="text-red-500"> *</Text>
              )}
            </Text>
            <TextInput
              ref={emailRef}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setAuthError("");
                setAuthSuccess("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              className={`text-base text-slate-900 dark:text-white py-2 border-b outline-none bg-transparent ${
                hasSubmitted && !email
                  ? "border-red-500"
                  : "border-slate-300 dark:border-slate-600"
              }`}
              placeholder="Enter your email"
              placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            />
            {hasSubmitted && !email && (
              <Text className="text-xs text-red-500 mt-1">
                Email is required
              </Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Password
              {hasSubmitted && !password && (
                <Text className="text-red-500"> *</Text>
              )}
            </Text>
            <View
              className={`flex-row items-center border-b ${
                hasSubmitted && !password
                  ? "border-red-500"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            >
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setAuthError("");
                  setAuthSuccess("");
                }}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
                className="flex-1 text-base text-slate-900 dark:text-white py-2 outline-none bg-transparent"
                placeholder="Create a password"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowPassword(!showPassword)}
                className="p-2"
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={18}
                  color={iconMuted}
                />
              </TouchableOpacity>
            </View>
            {hasSubmitted && !password && (
              <Text className="text-xs text-red-500 mt-1">
                Password is required
              </Text>
            )}
          </View>

          <View className="mb-8">
            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Confirm Password
              {hasSubmitted && !confirmPassword && (
                <Text className="text-red-500"> *</Text>
              )}
            </Text>
            <View
              className={`flex-row items-center border-b ${
                hasSubmitted && !confirmPassword
                  ? "border-red-500"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            >
              <TextInput
                ref={confirmPasswordRef}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setAuthError("");
                  setAuthSuccess("");
                }}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                className="flex-1 text-base text-slate-900 dark:text-white py-2 outline-none bg-transparent"
                placeholder="Retype your password"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-2"
              >
                <Feather
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={18}
                  color={iconMuted}
                />
              </TouchableOpacity>
            </View>
            {hasSubmitted && !confirmPassword && (
              <Text className="text-xs text-red-500 mt-1">
                Please confirm your password
              </Text>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={loading}
            className={`w-full py-4 rounded-full items-center justify-center shadow-sm ${
              loading
                ? "bg-blue-400 dark:bg-blue-500/50"
                : "bg-blue-600 dark:bg-blue-500"
            }`}
          >
            <Text className="text-white text-base font-bold">
              {loading ? "Creating Account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                Log in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
