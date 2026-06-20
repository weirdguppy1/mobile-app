import 'react-native-url-polyfill/auto';

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

/**
 * Persists the auth session in the device keychain/keystore on native. On web
 * we let supabase-js fall back to its default (localStorage), since SecureStore
 * is unavailable there.
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// const supabaseKey = process.env.EXPO_PUBLIC_PUBLISHABLE_KEY;

const supabaseUrl = process.env.EXPO_PUBLIC_NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_NEXT_PUBLIC_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_PUBLISHABLE_KEY in .env.local',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
