import { Text, View } from 'react-native';

/** A titled row of pill chips (interests, deal-breakers). Shared by ProfileView and
 *  the user profile page. */
export function ProfileChips({ title, labels }: { title: string; labels: string[] }) {
  return (
    <View className="gap-2">
      <Text className="prose-label text-graphite">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {labels.map((l) => (
          <View key={l} className="rounded-full border border-silver bg-canvas px-4 py-2.5">
            <Text className="prose-footnote text-graphite">{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
