import { useLocalSearchParams } from 'expo-router';

import RecordFormScreen from '@/modules/personal-hygiene/screens/RecordFormScreen';

export default function EditHygieneRecordRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecordFormScreen key={id} recordId={Number(id)} />;
}
