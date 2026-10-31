import { useLocalSearchParams } from 'expo-router';

import ApplicationFormScreen from '@/modules/cleaning-disinfection/screens/ApplicationFormScreen';

export default function EditCleaningApplicationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ApplicationFormScreen key={id} applicationId={Number(id)} />;
}
