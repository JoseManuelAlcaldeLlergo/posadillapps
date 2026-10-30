import { useLocalSearchParams } from 'expo-router';

import RegularFormScreen from '@/modules/vehicle-entries/screens/RegularFormScreen';

export default function EditRegularVehicleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RegularFormScreen key={id} regularId={Number(id)} />;
}
