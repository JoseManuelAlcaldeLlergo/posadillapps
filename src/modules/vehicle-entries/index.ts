/**
 * Public API of the vehicle entries module. Other modules import only from
 * here; this module never imports from them.
 */
export { normalizePlate, plateKey } from './plates';
export {
  deleteAutomaticVisit,
  linkAutomaticVisit,
  type AutomaticVisitInput,
} from './repository';
export type { VehicleVisit } from './schema';
export { VEHICLE_TYPE_LABELS, type VehicleType } from './vehicleTypes';
