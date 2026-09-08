import '../global.css';
import { Stack } from 'expo-router';

// Expo Router requires a default route export.
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
