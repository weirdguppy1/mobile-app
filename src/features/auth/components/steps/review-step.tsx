import { Text, View } from 'react-native';

import { useSignUpStore } from '@/features/auth/store/sign-up-store';

export function ReviewStep() {
  const university = useSignUpStore((s) => s.university);
  const email = useSignUpStore((s) => s.email);

  return (
    <>
      <Text className="prose-title text-ink">Looks{'\n'}good?</Text>
      <Text className="prose-subtitle mb-3">
        We&rsquo;ll email you a code to finish signing up.
      </Text>
      <View className="card border-continuous mt-2 px-4">
        <SummaryRow label="School" value={university ?? '—'} />
        <View className="h-px bg-hairline" />
        <SummaryRow label="Email" value={email} />
      </View>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1 py-4">
      <Text className="prose-caption font-semibold text-ash">{label}</Text>
      <Text className="prose-body font-semibold text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
