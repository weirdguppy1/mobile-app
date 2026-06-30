import { Stack } from 'expo-router';

// Anchor the stack to the conversations list. expo-router uses this (not the
// <Stack initialRouteName> prop) to seed the back stack when you navigate to a
// nested screen from outside this navigator — e.g. the Message button on a user
// profile, which lives above the tabs. Without it, opening a thread cross-stack
// lands with the thread as the only route: Back exits to Discover instead of the
// list, and the tab bar (index 0) covers the composer.
export const unstable_settings = {
  anchor: 'index',
  initialRouteName: 'index',
};

/** Nested stack for the Messages tab: the conversations list (index) and the
 *  pushed 1:1 chat thread. */
export default function MessagesLayout() {
  return <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />;
}
