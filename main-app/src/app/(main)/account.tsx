import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useSync } from "../../lib/SyncContext";

type EditType = "username" | "email" | "password" | null;

export default function AccountScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#3b82f6" : "#2563eb";
  const iconMuted = isDark ? "#94a3b8" : "#64748b";
  const { activeShows, logs, clearData } = useSync();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("Loading...");
  const [apiKey, setApiKey] = useState("Loading...");
  const [themePref, setThemePref] = useState<"system" | "light" | "dark">( "system", );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState<EditType>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmEditValue, setConfirmEditValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState({ title: "", description: "", });
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
      const cachedApiKey = await AsyncStorage.getItem("cached_api_key");

      if (cachedUsername) setUsername(cachedUsername);
      if (cachedEmail) setEmail(cachedEmail);
      if (cachedApiKey) setApiKey(cachedApiKey);

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
          .select("username, api_key")
          .eq("id", user.id)
          .single();

        if (data && !error) {
          if (data.username !== cachedUsername) {
            setUsername(data.username);
            await AsyncStorage.setItem("cached_username", data.username);
          }
          if (data.api_key && data.api_key !== cachedApiKey) {
            setApiKey(data.api_key);
            await AsyncStorage.setItem("cached_api_key", data.api_key);
          } else if (!data.api_key && !cachedApiKey) {
            setApiKey("No key found");
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
      if (clearData) await clearData();
      
      await AsyncStorage.multiRemove([
        "cached_username",
        "cached_email",
        "cached_api_key"
      ]);
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

  const handleExportData = async () => {
    try {
      setIsExporting(true);

      let csvContent =
        "Record Type,Show Name,Current Episode,Total Episodes,Timestamp\n";

      if (activeShows) {
        activeShows.forEach((show) => {
          const safeTitle = `"${show.show_name.replace(/"/g, '""')}"`;
          csvContent += `Active Show,${safeTitle},${show.latest_episode},${show.total_episodes || "N/A"},${show.updated_at}\n`;
        });
      }

      if (logs) {
        logs.forEach((log) => {
          const safeTitle = `"${log.show_name.replace(/"/g, '""')}"`;
          csvContent += `Watch Log,${safeTitle},${log.episode},N/A,${log.created_at}\n`;
        });
      }

      const fileName = `Watchlist_Export_${new Date().toISOString().split("T")[0]}.csv`;

      if (Platform.OS === "web") {
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        showPopup("Export Complete", "Your CSV file has been downloaded.");
        return;
      }

      const file = new File(Paths.document, fileName);
      if (!file.exists) {
        file.create();
      }
      file.write(csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export Watchlist Data",
        });
      } else {
        showPopup(
          "Export Failed",
          "File sharing is not supported on this device.",
        );
      }

      setIsExporting(false);
    } catch (error: any) {
      setIsExporting(false);
      showPopup(
        "Export Failed",
        error.message || "An unexpected error occurred.",
      );
    }
  };

  const copyToClipboard = async () => {
    if (apiKey && apiKey !== "Loading..." && apiKey !== "No key found") {
      await Clipboard.setStringAsync(apiKey);
      showPopup("Copied to Clipboard", "Your API key has been copied.");
    }
  };

  const handleRegenerateApiKey = () => {
    Alert.alert(
      "Regenerate API Key",
      "Are you sure? Your browser extension and bookmarklet will stop working until you update them with the new key.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Regenerate", style: "destructive", onPress: regenerateKey },
      ]
    );
  };

  const regenerateKey = async () => {
    setIsRegenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const newKey = Crypto.randomUUID();
      const { error } = await supabase
        .from("profiles")
        .update({ api_key: newKey })
        .eq("id", user.id);

      if (error) throw error;

      setApiKey(newKey);
      await AsyncStorage.setItem("cached_api_key", newKey);
      showPopup(
        "Key Regenerated",
        "Your new API key has been generated successfully."
      );
    } catch (error: any) {
      showPopup(
        "Update Failed",
        error.message || "Could not regenerate API key."
      );
    } finally {
      setIsRegenerating(false);
    }
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

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleExportData}
              disabled={isExporting}
              className="flex-row items-center justify-between px-4 py-3"
            >
              <View className="flex-row items-center">
                <Feather name="database" size={18} color={iconMuted} />
                <Text className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {isExporting ? "Exporting..." : "Export Data"}
                </Text>
              </View>
              <Feather name="download" size={18} color={iconMuted} />
            </TouchableOpacity>
          </View>

          <View className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-200 dark:border-slate-700">
            <Text className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Developer Settings
            </Text>

            <View className="px-4 py-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Feather name="key" size={18} color={iconMuted} />
                  <Text className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Extension API Key
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsKeyVisible(!isKeyVisible)}
                >
                  <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {isKeyVisible ? "Hide" : "Reveal"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                <Text
                  className="flex-1 text-sm text-slate-600 dark:text-slate-300 font-mono"
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {isKeyVisible ? apiKey : "••••••••••••••••••••••••••••••••"}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={copyToClipboard}
                  className="ml-3"
                >
                  <Feather name="copy" size={16} color={iconMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleRegenerateApiKey}
                disabled={isRegenerating}
                className={`mt-4 py-3 rounded-xl items-center border flex-row justify-center ${
                  isRegenerating
                    ? "bg-red-50/50 dark:bg-red-500/5 border-red-100/50 dark:border-red-500/10"
                    : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
                }`}
              >
                {isRegenerating ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Feather name="refresh-cw" size={14} color="#ef4444" />
                )}
                <Text className="ml-2 text-xs font-bold text-red-500 dark:text-red-400">
                  {isRegenerating ? "Regenerating..." : "Regenerate Key"}
                </Text>
              </TouchableOpacity>
            </View>
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

        <View className="mt-5 items-center">
          <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            © 2026 Ray Brook by Richter Anthony Yap
          </Text>
          <Text className="text-[10px] text-slate-400/80 dark:text-slate-500/80 mt-1 uppercase tracking-wider">
            All Rights Reserved
          </Text>
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
                    : popupConfig.title.includes("Export")
                      ? "download"
                      : popupConfig.title.includes("Copied") ||
                          popupConfig.title.includes("Regenerated")
                        ? "check-circle"
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