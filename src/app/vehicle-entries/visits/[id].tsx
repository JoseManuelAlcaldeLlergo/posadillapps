import { useLocalSearchParams } from 'expo-router';

import { feedEntriesOfVisitLink } from '@/modules/feed-entries';
import VisitFormScreen from '@/modules/vehicle-entries/screens/VisitFormScreen';

/** Wires the link to the source records here, so the vehicles module does not depend on them. */
export default function EditVisitRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VisitFormScreen key={id} visitId={Number(id)} sourceLink={feedEntriesOfVisitLink} />;
}
