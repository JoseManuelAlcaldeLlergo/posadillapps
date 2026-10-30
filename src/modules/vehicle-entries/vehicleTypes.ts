import type { SelectOption } from '@/core/ui/SelectField';

/** Stored keys; labels are what the user sees and what is exported. */
export const VEHICLE_TYPES = [
  'private_car',
  'feed_truck',
  'livestock_truck',
  'carcass_truck',
  'other',
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  private_car: 'Vehículo particular',
  feed_truck: 'Camión de alimento',
  livestock_truck: 'Camión de ganado',
  carcass_truck: 'Camión de retirada de cadáveres',
  other: 'Otros',
};

export const VEHICLE_TYPE_OPTIONS: SelectOption<VehicleType>[] = VEHICLE_TYPES.map((value) => ({
  value,
  label: VEHICLE_TYPE_LABELS[value],
}));

export function isVehicleType(value: string): value is VehicleType {
  return (VEHICLE_TYPES as readonly string[]).includes(value);
}
