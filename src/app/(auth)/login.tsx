import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [authError, setAuthError] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    title: "",
    description: "",
  });
  const [onPopupClose, setOnPopupClose] = useState<(() => void) | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const isRecoveryRef = useRef(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash.includes("type=recovery")
    ) {
      isRecoveryRef.current = true;
      setIsResettingPassword(true);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          isRecoveryRef.current = true;
          setIsResettingPassword(true);
          setAuthError("");
        } else if (event === "SIGNED_IN") {
          setTimeout(() => {
            if (!isRecoveryRef.current && session) {
              router.replace("/dashboard");
            }
          }, 500);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const showPopup = (
    title: string,
    description: string,
    onClose?: () => void,
  ) => {
    setPopupConfig({ title, description });
    setOnPopupClose(() => onClose || null);
    setPopupVisible(true);
  };

  const handleCloseModal = () => {
    setPopupVisible(false);
    if (onPopupClose) onPopupClose();
  };

  const handleLogin = async () => {
    setHasSubmitted(true);
    setAuthError("");

    if (!email || !password) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setAuthError("Incorrect email or password. Please try again.");
      } else if (error.message.includes("Email not confirmed")) {
        setAuthError("Please check your inbox and verify your email address.");
      } else if (error.message.includes("Network request failed")) {
        setAuthError("Network error. Please check your connection.");
      } else {
        setAuthError(error.message);
      }
    } else {
      router.replace("/dashboard");
    }
  };

  const handleForgotPassword = async () => {
    setAuthError("");

    if (!email) {
      setAuthError(
        "Please enter your email address above to reset your password.",
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      setAuthError(error.message);
    } else {
      showPopup(
        "Check your inbox",
        "We sent a password reset link to your email address.",
      );
    }
  };

  const handleSetNewPassword = async () => {
    setHasSubmitted(true);
    setAuthError("");

    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setAuthError(error.message);
    } else {
      showPopup(
        "Password Updated",
        "Your new password has been saved securely.",
        () => {
          router.replace("/dashboard");
        },
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#ECE8FC]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center items-center p-5"
      >
        <View className="w-full max-w-sm bg-white p-7 rounded-[32px] shadow-sm border border-purple-100">
          {authError ? (
            <View className="bg-red-50 p-3 rounded-xl border border-red-100 mb-6 flex-row items-center">
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text className="ml-2 text-sm text-red-600 flex-1">
                {authError}
              </Text>
            </View>
          ) : null}

          {isResettingPassword ? (
            <>
              <View className="items-center mb-8">
                <Text className="text-3xl font-bold text-slate-900 mb-2">
                  New Password
                </Text>
                <Text className="text-sm text-slate-500 text-center">
                  Create a new secure password.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-sm font-semibold text-slate-500 mb-1">
                  New Password{" "}
                  {hasSubmitted && !password && (
                    <Text className="text-red-500"> *</Text>
                  )}
                </Text>
                <View
                  className={`flex-row items-center border-b ${hasSubmitted && !password ? "border-red-500" : "border-slate-300"}`}
                >
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setAuthError("");
                    }}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    blurOnSubmit={false}
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

              <View className="mb-8">
                <Text className="text-sm font-semibold text-slate-500 mb-1">
                  Confirm Password{" "}
                  {hasSubmitted && !confirmPassword && (
                    <Text className="text-red-500"> *</Text>
                  )}
                </Text>
                <View
                  className={`flex-row items-center border-b ${hasSubmitted && !confirmPassword ? "border-red-500" : "border-slate-300"}`}
                >
                  <TextInput
                    ref={confirmPasswordRef}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setAuthError("");
                    }}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSetNewPassword}
                    className="flex-1 text-base text-slate-900 py-2 outline-none"
                    placeholder="Retype your password"
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-2"
                  >
                    <Feather
                      name={showConfirmPassword ? "eye" : "eye-off"}
                      size={18}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSetNewPassword}
                disabled={loading}
                className={`w-full py-4 rounded-full items-center justify-center shadow-sm ${loading ? "bg-purple-400" : "bg-purple-600"}`}
              >
                <Text className="text-white text-base font-bold">
                  {loading ? "Updating..." : "Save Password"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
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
                  Email{" "}
                  {hasSubmitted && !email && (
                    <Text className="text-red-500"> *</Text>
                  )}
                </Text>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setAuthError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  className={`text-base text-slate-900 py-2 border-b outline-none ${hasSubmitted && !email ? "border-red-500" : "border-slate-300"}`}
                  placeholder="Enter your email"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-semibold text-slate-500 mb-1">
                  Password{" "}
                  {hasSubmitted && !password && (
                    <Text className="text-red-500"> *</Text>
                  )}
                </Text>
                <View
                  className={`flex-row items-center border-b ${hasSubmitted && !password ? "border-red-500" : "border-slate-300"}`}
                >
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setAuthError("");
                    }}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
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

              <View className="flex-row justify-end mb-8">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleForgotPassword}
                >
                  <Text className="text-sm font-bold text-purple-700">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogin}
                disabled={loading}
                className={`w-full py-4 rounded-full items-center justify-center shadow-sm ${loading ? "bg-purple-400" : "bg-purple-600"}`}
              >
                <Text className="text-white text-base font-bold">
                  {loading ? "Logging in..." : "Log in"}
                </Text>
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
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={popupVisible}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center bg-black/40 p-5"
        >
          <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm items-center">
            <View className="w-16 h-16 rounded-full bg-purple-100 items-center justify-center mb-4">
              <Feather name="mail" size={24} color="#6D28D9" />
            </View>
            <Text className="text-xl font-bold text-slate-900 mb-2 text-center">
              {popupConfig.title}
            </Text>
            <Text className="text-sm text-slate-500 mb-6 text-center">
              {popupConfig.description}
            </Text>
            <TouchableOpacity
              onPress={handleCloseModal}
              className="w-full py-4 rounded-xl bg-purple-600 items-center"
            >
              <Text className="text-white font-bold text-base">Got it</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
