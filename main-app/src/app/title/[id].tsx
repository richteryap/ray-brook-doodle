import { useLocalSearchParams } from "expo-router";
import { Text, View, useColorScheme } from "react-native";

export default function TitleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Text className="text-xl font-bold text-slate-900 dark:text-white">
        Details for Title ID: {id}
      </Text>
    </View>
  );
}
