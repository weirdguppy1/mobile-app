import { Redirect, Stack } from 'expo-router';

/** Dev-only playground. In production this group redirects to the root. */
export default function DevLayout() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
