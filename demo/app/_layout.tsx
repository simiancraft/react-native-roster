import '../global.css';
import 'react-native-roster/nativewind';
import { Stack } from 'expo-router';

// Expo Router requires a default route export.
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090b' } }} />
  );
}
