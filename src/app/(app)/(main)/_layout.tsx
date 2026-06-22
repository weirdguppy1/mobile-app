import { Tabs } from 'expo-router';

import { BottomNav } from '@/features/navigation/components/BottomNav';

export default function MainLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="discover">
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
      {/* Legacy placeholder — kept reachable in code but off the tab bar. */}
      <Tabs.Screen name="home" options={{ href: null }} />
    </Tabs>
  );
}
