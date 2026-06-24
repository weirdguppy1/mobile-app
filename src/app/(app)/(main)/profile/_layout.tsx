import { Stack } from 'expo-router';

/** Nested stack for the Profile tab: the Edit/View screen (index), the settings
 *  screen, and the per-field editors. Edit/settings are pushed over the preview. */
export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />;
}
