import { useLocalSearchParams } from 'expo-router';

import TemplateFormScreen from '@/modules/personal-hygiene/screens/TemplateFormScreen';

export default function EditHygieneTemplateRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TemplateFormScreen key={id} templateId={Number(id)} />;
}
