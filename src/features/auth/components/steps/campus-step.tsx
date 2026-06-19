import { Text, View } from 'react-native';

import { UniversityCombobox } from '@/features/auth/components/university-combobox';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';

export function CampusStep() {
  const university = useSignUpStore((s) => s.university);
  const setUniversity = useSignUpStore((s) => s.setUniversity);

  return (
    <>
      <Text className="prose-title text-ink">First, your{'\n'}campus.</Text>
      <Text className="prose-subtitle mb-3">
        We match you with roommates at your school.
      </Text>
      <View className="mt-1 gap-3">
        <UniversityCombobox value={university} onChange={setUniversity} />
      </View>
    </>
  );
}
