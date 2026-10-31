import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { buildXlsxBase64, XLSX_MIME_TYPE } from './excel';
import { exportFileName } from './format';
import { buildPdfHtml, pageSize } from './pdf';
import type { PeriodType, TableDefinition } from './types';

/** Opens the Android print dialog with the table. */
export async function printTable<Row>(definition: TableDefinition<Row, PeriodType>, rows: readonly Row[]) {
  await Print.printAsync({ html: buildPdfHtml(definition, rows) });
}

/** Generates the PDF and opens the share sheet. `suffix` is appended to the file name. */
export async function sharePdf<Row>(
  definition: TableDefinition<Row, PeriodType>,
  rows: readonly Row[],
  suffix?: string,
) {
  // expo-print writes to its own cache folder, which the app may not be allowed
  // to read or move (e.g. in Expo Go). Take the base64 and write our own file.
  const { base64 } = await Print.printToFileAsync({
    html: buildPdfHtml(definition, rows),
    ...pageSize(definition.orientation),
    base64: true,
  });
  if (!base64) throw new Error('No se pudo generar el PDF');
  const file = new File(Paths.cache, exportFileName(definition.fileBaseName, 'pdf', suffix));
  if (file.exists) file.delete();
  await file.write(base64, { encoding: 'base64' });
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    dialogTitle: definition.title,
  });
}

/** Generates the .xlsx and opens the share sheet. `suffix` is appended to the file name. */
export async function shareXlsx<Row>(
  definition: TableDefinition<Row, PeriodType>,
  rows: readonly Row[],
  suffix?: string,
) {
  const file = new File(Paths.cache, exportFileName(definition.fileBaseName, 'xlsx', suffix));
  if (file.exists) file.delete();
  await file.write(buildXlsxBase64(definition, rows), { encoding: 'base64' });
  await Sharing.shareAsync(file.uri, {
    mimeType: XLSX_MIME_TYPE,
    dialogTitle: definition.title,
  });
}
