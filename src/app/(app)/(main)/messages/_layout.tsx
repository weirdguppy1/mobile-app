import { Stack } from 'expo-router';

/** Nested stack for the Messages tab: the conversations list (index) and the
 *  pushed 1:1 chat thread. */
export default function MessagesLayout() {
  return <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />;
}
