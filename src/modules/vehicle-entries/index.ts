/**
 * Public API of the vehicle entries module. Other modules import only from
 * here; this module never imports from them.
 */
export { normalizePlate, plateKey } from './plates';
export {
  deleteAutomaticVisit,
  linkAutomaticVisit,
  listUsedPlates,
  type AutomaticVisitInput,
} from './repository';
/** Only to declare foreign keys to visits; use the functions above to change them. */
export { vehicleVisits, type VehicleVisit } from './schema';
export { VEHICLE_TYPE_LABELS, type VehicleType } from './vehicleTypes';
