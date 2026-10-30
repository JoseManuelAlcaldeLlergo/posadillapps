import { useLocalSearchParams } from 'expo-router';

import SupplierDetailScreen from '@/modules/feed-entries/screens/SupplierDetailScreen';

export default function SupplierDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SupplierDetailScreen key={id} supplierId={Number(id)} />;
}
