import '../global.css';
import 'react-native-roster/nativewind';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { ThemeToggle } from '../components/theme';

// Expo Router requires a default route export.
export default function RootLayout() {
  return (
    <View className="flex-1 bg-background">
      <View className="h-8 flex-row items-center px-2">
        <ThemeToggle />
      </View>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
      />
    </View>
  );
}
