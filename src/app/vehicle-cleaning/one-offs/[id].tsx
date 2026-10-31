import { useLocalSearchParams } from 'expo-router';

import OneOffFormScreen from '@/modules/vehicle-cleaning/screens/OneOffFormScreen';

export default function EditOneOffCleaningRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OneOffFormScreen key={id} oneOffId={Number(id)} />;
}
