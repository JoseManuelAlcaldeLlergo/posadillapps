import { useLocalSearchParams } from 'expo-router';

import ProductFormScreen from '@/modules/cleaning-disinfection/screens/ProductFormScreen';

export default function EditCleaningProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductFormScreen key={id} productId={Number(id)} />;
}
