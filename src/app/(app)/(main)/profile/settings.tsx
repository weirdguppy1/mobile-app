import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { EditScreenShell } from '@/features/profile/components/EditScreenShell';
import { useOnboardingData, usePrivateContact } from '@/features/profile/hooks/use-profile';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { supabase } from '@/lib/supabase';
import { Button, TextField } from '@/shared/components';

/** Account settings: email (read-only), private phone, sign out. */
export default function SettingsScreen() {
  const { data } = useOnboardingData();
  const phoneQuery = usePrivateContact();

  return (
    <EditScreenShell title="Settings">
      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-6 pt-2" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text className="prose-label text-graphite">Account</Text>
          <View className="card border-continuous gap-0.5 px-4 py-3">
            <Text className="prose-caption text-ash">Email</Text>
            <Text className="prose-body text-ink">{data?.profile.email ?? '—'}</Text>
          </View>
        </View>

        <View className="gap-2">
          <Text className="prose-label text-graphite">Private phone</Text>
          {phoneQuery.isLoading ? (
            <ActivityIndicator color={Brand.ink} />
          ) : (
            <PhoneEditor initial={phoneQuery.data ?? ''} />
          )}
          <Text className="prose-caption text-ash">🔒 Only shared after you match with someone.</Text>
        </View>

        <Button variant="primary" onPress={() => supabase.auth.signOut()}>Sign out</Button>
      </ScrollView>
    </EditScreenShell>
  );
}

function PhoneEditor({ initial }: { initial: string }) {
  const { savePrivateContact } = useProfileMutations();
  const [phone, setPhone] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const dirty = phone.trim() !== baseline.trim();

  const onSave = async () => {
    await savePrivateContact.mutateAsync(phone);
    setBaseline(phone);
  };

  return (
    <View className="gap-3">
      <TextField value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="(555) 555-5555" />
      <Button variant="primary" onPress={onSave} loading={savePrivateContact.isPending} disabled={!dirty}>
        Save phone
      </Button>
    </View>
  );
}
