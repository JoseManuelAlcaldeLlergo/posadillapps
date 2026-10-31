import { useLocalSearchParams } from 'expo-router';

import RegularFormScreen from '@/modules/cleaning-disinfection/screens/RegularFormScreen';

export default function EditCleaningRegularRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RegularFormScreen key={id} regularId={Number(id)} />;
}
