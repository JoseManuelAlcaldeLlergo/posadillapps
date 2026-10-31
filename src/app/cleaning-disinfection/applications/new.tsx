import { useLocalSearchParams } from 'expo-router';

import ApplicationFormScreen from '@/modules/cleaning-disinfection/screens/ApplicationFormScreen';

export default function NewCleaningApplicationRoute() {
  const { repeat } = useLocalSearchParams<{ repeat?: string }>();
  return <ApplicationFormScreen key={repeat} repeatId={repeat ? Number(repeat) : undefined} />;
}
