/**
 * Public API of the vehicle cleaning module. No other module depends on it;
 * it reads plates from the vehicle entries module and product names from the
 * cleaning and disinfection module, only as suggestions.
 */
export type { CleaningVehicle, OneOffCleaning, PeriodicCleaning } from './schema';
