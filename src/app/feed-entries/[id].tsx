import { useLocalSearchParams } from 'expo-router';

import EntryFormScreen from '@/modules/feed-entries/screens/EntryFormScreen';

export default function EditFeedEntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EntryFormScreen key={id} entryId={Number(id)} />;
}
