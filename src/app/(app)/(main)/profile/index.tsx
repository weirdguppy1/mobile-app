import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { TabTransition } from '@/features/navigation/components/TabTransition';
import { useNavBarHeight } from '@/features/navigation/lib/use-nav-bar-height';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { PROFILE_FIELD_GROUPS, PROFILE_FIELDS, type ProfileField } from '@/features/profile/config/profile-fields';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';
import { isFieldHidden } from '@/features/profile/lib/field-visibility';
import { Profile } from '@/features/profile/types';
import { OptionGroup, PressScale } from '@/shared/components';

const MODE_OPTIONS = [{ value: 'view', label: 'View' }, { value: 'edit', label: 'Edit' }];
type Mode = 'view' | 'edit';

/** The Profile tab: an Edit | View toggle (View = how others see you; Edit = the
 *  per-field list + inline photos/prompts) and a settings gear. */
export default function ProfileScreen() {
  const navBarHeight = useNavBarHeight();
  const { data, isLoading, isError } = useOnboardingData();
  const [mode, setMode] = useState<Mode>('view');

  const body = () => {
    if (isLoading) {
      return <View className="flex-1 items-center justify-center"><ActivityIndicator color={Brand.ink} /></View>;
    }
    if (isError || !data) {
      return (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="prose-subtitle text-center">Couldn't load your profile. Pull to retry or restart the app.</Text>
        </View>
      );
    }
    return mode === 'view'
      ? <ProfileView profile={data.profile} photos={data.photos} prompts={data.prompts} bottomInset={navBarHeight} />
      : <EditList profile={data.profile} photoCount={data.photos.length} promptCount={data.prompts.length} bottomInset={navBarHeight} />;
  };

  return (
    <TabTransition className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View className="flex-row items-center gap-3 px-6 pb-3 pt-2">
          <View className="flex-1">
            <OptionGroup options={MODE_OPTIONS} value={mode} onChange={(v) => setMode(v as Mode)} />
          </View>
          <PressScale
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={12}
            onPress={() => router.push({ pathname: '/profile/settings' })}>
            <Settings size={22} color={Brand.ink} strokeWidth={2} />
          </PressScale>
        </View>
        {body()}
      </SafeAreaView>
    </TabTransition>
  );
}

function EditList({ profile, photoCount, promptCount, bottomInset }: { profile: Profile; photoCount: number; promptCount: number; bottomInset: number }) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-5 px-6 pt-2"
      contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      showsVerticalScrollIndicator={false}>
      <View className="gap-2">
        <Text className="prose-label text-graphite">Photos & prompts</Text>
        <View className="card border-continuous px-4">
          <LinkRow label="Photos" value={`${photoCount} added`} onPress={() => router.push({ pathname: '/profile/edit/photos' })} />
          <LinkRow label="Prompts" value={`${promptCount} answered`} divider onPress={() => router.push({ pathname: '/profile/edit/prompts' })} />
        </View>
      </View>
      {PROFILE_FIELD_GROUPS.map((group) => (
        <View key={group} className="gap-2">
          <Text className="prose-label text-graphite">{group}</Text>
          <View className="card border-continuous px-4">
            {PROFILE_FIELDS.filter((f) => f.group === group).map((f, i) => (
              <EditRow key={f.id} field={f} profile={profile} divider={i > 0} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function LinkRow({ label, value, onPress, divider }: { label: string; value: string; onPress: () => void; divider?: boolean }) {
  return (
    <PressScale
      accessibilityRole="button"
      onPress={onPress}
      className={`flex-row items-center gap-3 py-3 ${divider ? 'border-t border-silver' : ''}`}>
      <View className="flex-1">
        <Text className="prose-footnote font-semibold text-ink">{label}</Text>
        <Text className="prose-caption text-ash">{value}</Text>
      </View>
      <ChevronRight size={18} color={Brand.fog} strokeWidth={2} />
    </PressScale>
  );
}

function EditRow({ field, profile, divider }: { field: ProfileField; profile: Profile; divider: boolean }) {
  const hidden = field.hideable && isFieldHidden(profile.hidden_fields, field.id);
  return (
    <PressScale
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/profile/edit/[field]', params: { field: field.id } })}
      className={`flex-row items-center gap-3 py-3 ${divider ? 'border-t border-silver' : ''}`}>
      <View className="flex-1">
        <Text className="prose-footnote font-semibold text-ink">{field.label}</Text>
        <Text className="prose-caption text-ash" numberOfLines={1}>{field.read(profile)}</Text>
      </View>
      {field.hideable ? <Text className="prose-caption text-ash">{hidden ? 'Hidden' : 'Visible'}</Text> : null}
      <ChevronRight size={18} color={Brand.fog} strokeWidth={2} />
    </PressScale>
  );
}
