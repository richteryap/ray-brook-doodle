import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function TitleDetailsScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold">Details for Title ID: {id}</Text>
    </View>
  );
}
