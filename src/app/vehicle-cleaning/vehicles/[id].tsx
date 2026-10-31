import { useLocalSearchParams } from 'expo-router';

import VehicleFormScreen from '@/modules/vehicle-cleaning/screens/VehicleFormScreen';

export default function EditCleaningVehicleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VehicleFormScreen key={id} vehicleId={Number(id)} />;
}
