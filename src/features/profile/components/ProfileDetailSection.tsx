import { Text, View } from 'react-native';

import { ProfileDetailGroup } from '@/features/profile/lib/profile-detail-groups';

/** One titled card of label/value rows for a profile detail group. Shared by
 *  ProfileView and the user profile page. */
export function ProfileDetailSection({ group }: { group: ProfileDetailGroup }) {
  return (
    <View className="gap-2">
      <Text className="prose-label text-graphite">{group.group}</Text>
      <View className="card border-continuous px-4">
        {group.rows.map((row, i) => (
          <DetailRow key={row.id} label={row.label} value={row.value} divider={i > 0} />
        ))}
      </View>
    </View>
  );
}

function DetailRow({ label, value, divider }: { label: string; value: string; divider: boolean }) {
  return (
    <View className={`flex-row items-center justify-between gap-3 py-3 ${divider ? 'border-t border-silver' : ''}`}>
      <Text className="prose-footnote text-slate">{label}</Text>
      <Text className="prose-footnote flex-1 text-right font-medium text-ink">{value}</Text>
    </View>
  );
}
