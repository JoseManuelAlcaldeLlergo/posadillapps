import { useLocalSearchParams } from 'expo-router';

import OneOffFormScreen from '@/modules/vehicle-cleaning/screens/OneOffFormScreen';

export default function NewOneOffCleaningRoute() {
  const { repeat } = useLocalSearchParams<{ repeat?: string }>();
  return <OneOffFormScreen key={repeat} repeatId={repeat ? Number(repeat) : undefined} />;
}
