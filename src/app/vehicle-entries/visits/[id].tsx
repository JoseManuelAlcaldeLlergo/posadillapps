import { useLocalSearchParams } from 'expo-router';

import VisitFormScreen from '@/modules/vehicle-entries/screens/VisitFormScreen';

export default function EditVisitRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VisitFormScreen key={id} visitId={Number(id)} />;
}
