import { toIsoDate } from '@/core/dates';
import type { SyncDatabase } from '@/core/db/types';
import { addProductiveUnit, setFarmCode } from '@/core/farm';
import {
  createApplication,
  createRegular as createCleaningRegular,
} from '@/modules/cleaning-disinfection/repository';
import { saveProduct } from '@/modules/cleaning-disinfection/productsRepository';
import { addFeed, addTruck, createSupplier } from '@/modules/feed-entries/favoritesRepository';
import { saveEntry } from '@/modules/feed-entries/repository';
import type { FeedUnit } from '@/modules/feed-entries/units';
import {
  createRecord,
  previewYear as previewHygieneYear,
  saveGeneratedYear as saveHygieneYear,
} from '@/modules/personal-hygiene/repository';
import { saveTemplate } from '@/modules/personal-hygiene/templatesRepository';
import {
  createOneOff,
  previewYear as previewCleaningYear,
  saveGeneratedYear as saveCleaningYear,
  saveVehicle,
} from '@/modules/vehicle-cleaning/repository';
import { saveRegular, saveVisit, type VisitInput } from '@/modules/vehicle-entries/repository';

/**
 * Realistic data for a sheep and pig farm, covering every module, from
 * January of the previous year up to `today`. Uses the real repositories,
 * so the rows are what the app itself would save. Deterministic for a
 * given `today`.
 */
export function seedSampleData(db: SyncDatabase, today: Date): void {
  const random = mulberry32(20261031);
  const end = toIsoDate(today);
  const start = `${today.getFullYear() - 1}-01-02`;
  const years = [today.getFullYear() - 1, today.getFullYear()];

  // --- Farm settings ---
  const farmCode = setFarmCode(db, 'ES140210000123')!;
  for (const unit of ['Ovino', 'Porcino', 'Ovino y porcino']) addProductiveUnit(db, unit);

  // --- Feed entries (and their automatic vehicle visits) ---
  type Delivery = { feed: string; unit: FeedUnit; min: number; max: number; step: number };
  const supplierPlans: {
    name: string;
    feeds: Delivery[];
    trucks: string[];
    everyDays: [number, number];
    invoicePrefix: string | null;
  }[] = [
    {
      name: 'Piensos Guadalquivir S.L.',
      feeds: [
        { feed: 'Cebo cerdos crecimiento', unit: 'kg', min: 12000, max: 24000, step: 500 },
        { feed: 'Pienso lechones prestarter', unit: 'kg', min: 1500, max: 4000, step: 250 },
        { feed: 'Cerdas gestación', unit: 'kg', min: 6000, max: 10000, step: 500 },
      ],
      trucks: ['4521 KTB', '0937 LFD'],
      everyDays: [6, 9],
      invoicePrefix: 'PG',
    },
    {
      name: 'Cooperativa Agropecuaria Nuestra Señora de la Sierra',
      feeds: [
        { feed: 'Pienso ovejas lactación', unit: 'kg', min: 4000, max: 9000, step: 500 },
        { feed: 'Corderos cebo granulado', unit: 'kg', min: 3000, max: 7000, step: 500 },
        { feed: 'Cebada grano', unit: 't', min: 8, max: 20, step: 0.5 },
      ],
      trucks: ['7712 HZM'],
      everyDays: [10, 15],
      invoicePrefix: 'COOP',
    },
    {
      name: 'Forrajes Hermanos Ruiz',
      feeds: [
        { feed: 'Paja de cebada (pacas)', unit: 't', min: 6, max: 14, step: 0.5 },
        { feed: 'Heno de alfalfa', unit: 't', min: 4, max: 10, step: 0.5 },
      ],
      trucks: [],
      everyDays: [25, 40],
      invoicePrefix: null,
    },
  ];

  for (const plan of supplierPlans) {
    const supplier = createSupplier(db, plan.name);
    for (const feed of plan.feeds) addFeed(db, supplier.id, feed.feed);
    for (const plate of plan.trucks) addTruck(db, supplier.id, plate);
  }

  for (const plan of supplierPlans) {
    let invoiceNumber = 100 + Math.floor(random() * 300);
    for (let date = addDays(start, between(random, 0, 5)); date <= end; ) {
      // One invoice can bring several feeds on the same truck.
      const count = plan.feeds.length > 1 && random() < 0.3 ? 2 : 1;
      const feeds = shuffle(random, plan.feeds).slice(0, count);
      const invoice =
        plan.invoicePrefix && random() > 0.08
          ? `${plan.invoicePrefix}-${date.slice(0, 4)}/${String(invoiceNumber++).padStart(5, '0')}`
          : null;
      const truckPlate = plan.trucks.length > 0 && random() > 0.05 ? pick(random, plan.trucks) : null;
      for (const feed of feeds) {
        saveEntry(db, {
          date,
          quantity: roundTo(between(random, feed.min, feed.max), feed.step),
          unit: feed.unit,
          supplierName: plan.name,
          feedName: feed.feed,
          invoice,
          truckPlate,
        });
      }
      date = addDays(date, between(random, ...plan.everyDays));
    }
  }

  // Occasional supplier that is not a favorite: only the text snapshot is kept.
  for (const date of [addDays(start, 70), addDays(end, -120), addDays(end, -12)]) {
    if (date < start || date > end) continue;
    saveEntry(db, {
      date,
      quantity: roundTo(between(random, 800, 2000), 100),
      unit: 'kg',
      supplierName: 'Molinos La Esperanza',
      feedName: 'Corrector vitamínico-mineral ovino',
      invoice: `ME-${String(between(random, 1000, 9999))}`,
      truckPlate: null,
    });
  }

  // --- Vehicle entries ---
  saveRegular(db, {
    plate: '5678 HBC',
    frequency: 'A diario',
    reason: 'Control y cuidado de animales',
    vehicleType: 'private_car',
    active: true,
  });
  saveRegular(db, {
    plate: '2290 JRW',
    frequency: 'A diario',
    reason: 'Control y cuidado de animales',
    vehicleType: 'private_car',
    active: true,
  });
  saveRegular(db, {
    plate: '8814 GNP',
    frequency: 'Semanalmente',
    reason: 'Veterinario',
    vehicleType: 'private_car',
    active: true,
  });
  saveRegular(db, {
    plate: '3365 FDK',
    frequency: 'Según guías',
    reason: 'Transporte de animales',
    vehicleType: 'livestock_truck',
    active: true,
  });
  saveRegular(db, {
    plate: '6120 BCX',
    frequency: 'Semanalmente',
    reason: 'Veterinario',
    vehicleType: 'private_car',
    active: false,
  });

  const visitPlans: (Omit<VisitInput, 'date'> & { everyDays: [number, number] })[] = [
    { plate: '8814 GNP', reason: 'Veterinario', vehicleType: 'private_car', everyDays: [10, 20] },
    { plate: '3365 FDK', reason: 'Transporte de animales', vehicleType: 'livestock_truck', everyDays: [25, 45] },
    { plate: '1048 KMV', reason: 'Recogida de animales (venta)', vehicleType: 'livestock_truck', everyDays: [40, 70] },
    { plate: '9402 HHL', reason: 'Retirada de cadáveres', vehicleType: 'carcass_truck', everyDays: [12, 25] },
  ];
  for (const plan of visitPlans) {
    for (let date = addDays(start, between(random, 0, 10)); date <= end; ) {
      const { everyDays, ...visit } = plan;
      saveVisit(db, { ...visit, date });
      date = addDays(date, between(random, ...everyDays));
    }
  }
  const silos = { plate: '7731 LBD', reason: 'Técnico de mantenimiento de silos', vehicleType: 'other' } as const;
  saveVisit(db, { ...silos, date: addDays(end, -200) });
  saveVisit(db, { ...silos, date: addDays(end, -3) });
  saveVisit(db, {
    date: addDays(end, -45),
    plate: '0219 KXT',
    reason: 'Inspección de la Oficina Comarcal Agraria',
    vehicleType: 'private_car',
  });

  // --- Vehicle cleaning ---
  const cleaningVehicles = [
    { plate: 'E 4417 BFT', frequency: 'Semanalmente', productName: 'Virkon S', vehicleType: 'Tractor', active: true },
    { plate: 'R 2093 BCM', frequency: 'Mensualmente', productName: 'Virkon S', vehicleType: 'Remolque', active: true },
    { plate: '5678 HBC', frequency: 'Semanalmente', productName: 'Zotal Z', vehicleType: 'Particular', active: true },
    { plate: '2290 JRW', frequency: 'Mensualmente', productName: 'Zotal Z', vehicleType: 'Turismo', active: true },
    { plate: 'E 0815 BBN', frequency: 'Mensualmente', productName: 'Virkon S', vehicleType: 'Tractor', active: false },
  ];
  for (const vehicle of cleaningVehicles) saveVehicle(db, vehicle);
  for (const year of years) saveCleaningYear(db, year, previewCleaningYear(db, year).rows);
  for (let date = addDays(start, between(random, 5, 20)); date <= end; ) {
    const vehicle = pick(random, cleaningVehicles.slice(0, 4));
    createOneOff(db, {
      date,
      plate: vehicle.plate,
      productName: random() < 0.7 ? 'Virkon S' : 'Zotal Z',
      vehicleType: vehicle.vehicleType,
      reviewText: random() < 0.8 ? 'Correcta' : null,
    });
    date = addDays(date, between(random, 18, 40));
  }

  // --- Personal hygiene ---
  const hygieneTemplates = [
    {
      action: 'Limpieza de manos, botas',
      productiveUnit: 'Ovino y porcino',
      place: 'Naves',
      result: 'Mensualmente año {año}',
      correctiveMeasures: null,
      dateText: '1 de cada mes {año}',
      active: true,
    },
    {
      action: 'Cambio de ropa de trabajo',
      productiveUnit: 'Ovino y porcino',
      place: 'Vestuario',
      result: 'Semanalmente año {año}',
      correctiveMeasures: null,
      dateText: 'Cada lunes {año}',
      active: true,
    },
    {
      action: 'Desinfección de calzado en pediluvio a la entrada',
      productiveUnit: 'Porcino',
      place: 'Entrada de naves de cebo',
      result: 'Diariamente año {año}',
      correctiveMeasures: 'Renovar la solución del pediluvio si está sucia',
      dateText: 'A diario {año}',
      active: true,
    },
    {
      action: 'Revisión del botiquín',
      productiveUnit: 'Ovino y porcino',
      place: 'Oficina',
      result: 'Trimestralmente año {año}',
      correctiveMeasures: 'Reponer el material caducado',
      dateText: '1 de enero, abril, julio y octubre {año}',
      active: true,
    },
    {
      action: 'Limpieza de manos en el aprisco',
      productiveUnit: 'Ovino',
      place: 'Aprisco',
      result: 'Mensualmente año {año}',
      correctiveMeasures: null,
      dateText: '1 de cada mes {año}',
      active: false,
    },
  ];
  for (const template of hygieneTemplates) saveTemplate(db, template);
  for (const year of years) saveHygieneYear(db, year, farmCode, previewHygieneYear(db, year).rows);
  createRecord(
    db,
    {
      year: years[1],
      templateId: null,
      productiveUnit: 'Porcino',
      action: 'Formación en bioseguridad del personal',
      place: 'Oficina',
      result: `Realizada en marzo ${years[1]}`,
      correctiveMeasures: null,
      dateText: `15 de marzo ${years[1]}`,
    },
    farmCode,
  );

  // --- Cleaning and disinfection ---
  const products = [
    { name: 'Virkon S', defaultWaitingDays: 0, defaultPlace: 'Naves, suelo y paredes' },
    { name: 'Zotal Z', defaultWaitingDays: 1, defaultPlace: 'Naves, suelo y paredes' },
    { name: 'Cal viva', defaultWaitingDays: 2, defaultPlace: 'Fosas y estercoleros' },
    { name: 'Hipoclorito sódico 5 %', defaultWaitingDays: 0, defaultPlace: 'Bebederos' },
  ];
  for (const product of products) saveProduct(db, product);

  createCleaningRegular(
    db,
    {
      productiveUnit: 'Ovino y porcino',
      productName: 'Hipoclorito sódico 5 %',
      place: 'Bebederos',
      waitingDays: 0,
      reviewDate: null,
      frequency: 'Semanalmente',
      active: true,
    },
    farmCode,
  );
  createCleaningRegular(
    db,
    {
      productiveUnit: 'Porcino',
      productName: 'Virkon S',
      place: 'Pasillos y muelle de carga',
      waitingDays: 0,
      reviewDate: null,
      frequency: 'Mensualmente',
      active: true,
    },
    farmCode,
  );

  const applicationPlans = [
    { productiveUnit: 'Porcino', productName: 'Virkon S', place: 'Naves, suelo y paredes', waitingDays: 0 },
    { productiveUnit: 'Ovino', productName: 'Zotal Z', place: 'Naves, suelo y paredes', waitingDays: 1 },
    { productiveUnit: 'Ovino y porcino', productName: 'Cal viva', place: 'Fosas y estercoleros', waitingDays: 2 },
    // Vaciado sanitario of the fattening barn: longer wait and a non-favorite product.
    {
      productiveUnit: 'Porcino',
      productName: 'Sosa cáustica',
      place: 'Nave de cebo 2 tras el vaciado sanitario',
      waitingDays: 7,
    },
  ];
  for (let date = addDays(start, between(random, 3, 12)); date <= end; ) {
    const plan = random() < 0.12 ? applicationPlans[3] : pick(random, applicationPlans.slice(0, 3));
    const reviewed = addDays(date, plan.waitingDays);
    createApplication(
      db,
      { ...plan, date, reviewDate: reviewed <= end && random() < 0.85 ? reviewed : null },
      farmCode,
    );
    date = addDays(date, between(random, 10, 24));
  }
}

/** Small seeded PRNG, so the same day always gives the same data. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max]. */
function between(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

function shuffle<T>(random: () => number, items: readonly T[]): T[] {
  return [...items].sort(() => random() - 0.5);
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return toIsoDate(new Date(year, month - 1, day + days));
}
