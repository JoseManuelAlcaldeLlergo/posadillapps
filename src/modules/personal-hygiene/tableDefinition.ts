import { SIGNATURE_ROW_HEIGHT, type TableDefinition } from '@/core/export/types';

import type { HygieneRecord } from './schema';

export type HygieneExportRow = Pick<
  HygieneRecord,
  | 'id'
  | 'year'
  | 'position'
  | 'farmCode'
  | 'productiveUnit'
  | 'action'
  | 'place'
  | 'result'
  | 'correctiveMeasures'
  | 'dateText'
>;

/** Same columns, order and title as the paper form, with an empty signature column. */
export const personalHygieneTable: TableDefinition<HygieneExportRow, 'yearRange'> = {
  id: 'personal-hygiene',
  title: 'Higiene personal',
  heading: ['PLAN DE CONTROL DE BUENAS PRÁCTICAS DE HIGIENE PERSONAL'],
  fileBaseName: 'higiene-personal',
  orientation: 'landscape',
  periodType: 'yearRange',
  bodyRowHeight: SIGNATURE_ROW_HEIGHT,
  columns: [
    {
      key: 'farmCode',
      header: 'CÓDIGO DE EXPLOTACIÓN',
      width: 16,
      value: (row) => ({ kind: 'text', value: row.farmCode }),
    },
    {
      key: 'productiveUnit',
      header: 'UNIDAD PRODUCTIVA',
      width: 14,
      value: (row) => ({ kind: 'text', value: row.productiveUnit }),
    },
    {
      key: 'action',
      header: 'ACTUACIÓN',
      width: 22,
      value: (row) => ({ kind: 'text', value: row.action }),
    },
    {
      key: 'place',
      header: 'LUGAR',
      width: 12,
      value: (row) => ({ kind: 'text', value: row.place }),
    },
    {
      key: 'result',
      header: 'RESULTADO',
      width: 20,
      value: (row) => ({ kind: 'text', value: row.result }),
    },
    {
      key: 'correctiveMeasures',
      header: 'MEDIDAS CORRECTORAS',
      width: 18,
      value: (row) => ({ kind: 'text', value: row.correctiveMeasures }),
    },
    {
      key: 'signature',
      header: 'FIRMA DEL RESPONSABLE',
      width: 20,
      value: () => ({ kind: 'text', value: null }),
    },
    {
      key: 'dateText',
      header: 'FECHA',
      width: 16,
      align: 'center',
      value: (row) => ({ kind: 'text', value: row.dateText }),
    },
  ],
  // By year, then in template order.
  compareRows: (a, b) => a.year - b.year || a.position - b.position || a.id - b.id,
};
