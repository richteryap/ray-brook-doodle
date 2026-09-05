import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

type EditType = "username" | "email" | "password" | null;

export default function AccountScreen() {
  const router = useRouter();

  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#3b82f6" : "#2563eb";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("Loading...");
  const [themePref, setThemePref] = useState<"system" | "light" | "dark">(
    "system",
  );

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState<EditType>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmEditValue, setConfirmEditValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    title: "",
    description: "",
  });
  const [onPopupClose, setOnPopupClose] = useState<(() => void) | null>(null);

  useEffect(() => {
    async function loadThemePref() {
      const savedTheme = await AsyncStorage.getItem("app_theme");
      if (
        savedTheme === "dark" ||
        savedTheme === "light" ||
        savedTheme === "system"
      ) {
        setThemePref(savedTheme);
      }
    }
    loadThemePref();
  }, []);

  useEffect(() => {
    async function loadUserData() {
      const cachedUsername = await AsyncStorage.getItem("cached_username");
      const cachedEmail = await AsyncStorage.getItem("cached_email");

      if (cachedUsername) setUsername(cachedUsername);
      if (cachedEmail) setEmail(cachedEmail);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (user.email && user.email !== cachedEmail) {
          setEmail(user.email);
          await AsyncStorage.setItem("cached_email", user.email);
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (data && !error) {
          if (data.username !== cachedUsername) {
            setUsername(data.username);
            await AsyncStorage.setItem("cached_username", data.username);
          }
        } else if (!cachedUsername) {
          setUsername("Unknown User");
        }
      } else {
        router.replace("/login");
      }
    }

    loadUserData();
  }, []);

  const maskEmail = (emailStr: string) => {
    if (!emailStr) return "Loading...";
    return "••••••••••••";
  };

  const showPopup = (
    title: string,
    description: string,
    onClose?: () => void,
  ) => {
    setPopupConfig({ title, description });
    setOnPopupClose(() => onClose || null);
    setPopupVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
    if (onPopupClose) onPopupClose();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showPopup("Error Signing Out", error.message);
    } else {
      await AsyncStorage.removeItem("cached_username");
      await AsyncStorage.removeItem("cached_email");
      router.replace("/login");
    }
  };

  const openEditModal = (type: EditType) => {
    setEditType(type);
    setEditValue("");
    setConfirmEditValue("");
    setShowPassword(false);
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editValue.trim()) {
      showPopup("Missing Field", `Please enter a new ${editType}.`);
      return;
    }

    if (editType === "password") {
      if (editValue !== confirmEditValue) {
        showPopup(
          "Passwords Do Not Match",
          "Please ensure both passwords are exactly the same.",
        );
        return;
      }

      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
      if (!passwordRegex.test(editValue)) {
        showPopup(
          "Weak Password",
          "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.",
        );
        return;
      }
    }

    setIsUpdating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsUpdating(false);
      return;
    }

    let errorResult = null;

    if (editType === "username") {
      const { error } = await supabase
        .from("profiles")
        .update({ username: editValue.trim() })
        .eq("id", user.id);
      errorResult = error;
      if (!error) {
        setUsername(editValue.trim());
        await AsyncStorage.setItem("cached_username", editValue.trim());
      }
    } else if (editType === "email") {
      const { error } = await supabase.auth.updateUser({
        email: editValue.trim(),
      });
      errorResult = error;
    } else if (editType === "password") {
      const { error } = await supabase.auth.updateUser({ password: editValue });
      errorResult = error;
    }

    setIsUpdating(false);

    if (errorResult) {
      showPopup("Update Failed", errorResult.message);
    } else {
      setEditModalVisible(false);
      if (editType === "email") {
        showPopup(
          "Verify Email",
          "We sent a confirmation link to both your old and new email addresses. Please verify to confirm the change.",
        );
      } else if (editType === "password") {
        showPopup("Success", "Your password has been updated securely.");
      }
    }
  };

  const handleThemeToggle = async () => {
    const nextTheme =
      themePref === "system"
        ? "light"
        : themePref === "light"
          ? "dark"
          : "system";
    setThemePref(nextTheme);
    setColorScheme(nextTheme);
    await AsyncStorage.setItem("app_theme", nextTheme);
  };

  return (
    <SafeAreaView className="flex-1 w-full h-full bg-slate-50 dark:bg-slate-900">
      <ScrollView
        className="flex-1 w-full h-full px-4 bg-slate-50 dark:bg-slate-900"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="pt-4 pb-4">
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
            <Text className="ml-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
              Back
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 items-center shadow-sm border border-slate-200 dark:border-slate-700 mb-2">
          <View className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mb-4">
            <Feather name="user" size={32} color={primaryColor} />
          </View>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {username}
          </Text>
        </View>

        <View className="gap-y-2">
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-200 dark:border-slate-700">
            <Text className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Account
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openEditModal("username")}
              className="flex-row items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-700/50"
            >
              <View className="flex-row items-center">
                <Feather name="at-sign" size={18} color={iconMuted} />
                <Text className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Username
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-sm font-medium text-slate-400 mr-2">
                  {username}
                </Text>
                <Feather name="edit-2" size={16} color={iconMuted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openEditModal("email")}
              className="flex-row items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-700/50"
            >
              <View className="flex-row items-center">
                <Feather name="mail" size={18} color={iconMuted} />
                <Text className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email Address
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-sm font-medium text-slate-400 mr-2">
                  {maskEmail(email)}
                </Text>
                <Feather name="edit-2" size={16} color={iconMuted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openEditModal("password")}
              className="flex-row items-center justify-between px-4 py-3"
            >
              <View className="flex-row items-center">
                <Feather name="lock" size={18} color={iconMuted} />
                <Text className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Change Password
                </Text>
              </View>
              <Feather name="edit-2" size={16} color={iconMuted} />
            </TouchableOpacity>
          </View>

          <View className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-200 dark:border-slate-700">
            <Text className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Preferences
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleThemeToggle}
              className="flex-row items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-700/50"
            >
              <View className="flex-row items-center">
                <Feather
                  name={
                    themePref === "system"
                      ? "smartphone"
                      : themePref === "dark"
                        ? "moon"
                        : "sun"
                  }
                  size={18}
                  color={iconMuted}
                />
                <Text className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Theme
                </Text>
              </View>
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400 capitalize">
                {themePref}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center">
                <Feather name="database" size={18} color={iconMuted} />
                <Text className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Export Data
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={iconMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            className="mt-1 bg-red-50 dark:bg-red-500/10 py-4 rounded-xl border border-red-100 dark:border-red-500/20 items-center justify-center flex-row"
          >
            <Feather name="log-out" size={18} color="#ef4444" />
            <Text className="ml-2 text-sm font-bold text-red-500 dark:text-red-400">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 w-full h-full justify-center items-center bg-black/50 p-5"
        >
          <View className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 capitalize">
              Change {editType}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Enter your new {editType} below.
            </Text>

            {editType === "password" ? (
              <>
                <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl mb-3 bg-slate-50 dark:bg-slate-900 px-4">
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholder="New Password"
                    placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                    className="flex-1 text-base text-slate-900 dark:text-white py-3 outline-none bg-transparent"
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={18}
                      color={iconMuted}
                    />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl mb-6 bg-slate-50 dark:bg-slate-900 px-4">
                  <TextInput
                    value={confirmEditValue}
                    onChangeText={setConfirmEditValue}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholder="Confirm New Password"
                    placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                    className="flex-1 text-base text-slate-900 dark:text-white py-3 outline-none bg-transparent"
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={18}
                      color={iconMuted}
                    />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TextInput
                value={editValue}
                onChangeText={setEditValue}
                autoCapitalize="none"
                keyboardType={
                  editType === "email" ? "email-address" : "default"
                }
                placeholder={`New ${editType}`}
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="text-base text-slate-900 dark:text-white py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 bg-slate-50 dark:bg-slate-900 bg-transparent"
              />
            )}

            <View className="flex-row justify-end gap-x-3">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-700"
              >
                <Text className="text-slate-600 dark:text-slate-300 font-bold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdate}
                disabled={isUpdating}
                className={`px-5 py-3 rounded-xl ${isUpdating ? "bg-blue-400 dark:bg-blue-500/50" : "bg-blue-600 dark:bg-blue-500"}`}
              >
                <Text className="text-white font-bold">
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={popupVisible}
        onRequestClose={handleClosePopup}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 w-full h-full justify-center items-center bg-black/50 p-5"
        >
          <View className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 items-center">
            <View className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mb-4">
              <Feather
                name={
                  popupConfig.title.includes("Failed") ||
                  popupConfig.title.includes("Error") ||
                  popupConfig.title.includes("Missing") ||
                  popupConfig.title.includes("Match") ||
                  popupConfig.title.includes("Weak")
                    ? "alert-circle"
                    : "mail"
                }
                size={24}
                color={primaryColor}
              />
            </View>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              {popupConfig.title}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
              {popupConfig.description}
            </Text>
            <TouchableOpacity
              onPress={handleClosePopup}
              className="w-full py-4 rounded-xl bg-blue-600 dark:bg-blue-500 items-center"
            >
              <Text className="text-white font-bold text-base">Got it</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
