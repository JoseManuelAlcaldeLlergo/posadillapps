import { useLocalSearchParams } from 'expo-router';

import PeriodicFormScreen from '@/modules/vehicle-cleaning/screens/PeriodicFormScreen';

export default function EditPeriodicCleaningRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PeriodicFormScreen key={id} periodicId={Number(id)} />;
}
