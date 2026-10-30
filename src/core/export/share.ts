import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { buildXlsxBase64, XLSX_MIME_TYPE } from './excel';
import { exportFileName } from './format';
import { buildPdfHtml, pageSize } from './pdf';
import type { TableDefinition } from './types';

/** Opens the Android print dialog with the table. */
export async function printTable<Row>(definition: TableDefinition<Row>, rows: readonly Row[]) {
  await Print.printAsync({ html: buildPdfHtml(definition, rows) });
}

/** Generates the PDF and opens the share sheet. `suffix` is appended to the file name. */
export async function sharePdf<Row>(
  definition: TableDefinition<Row>,
  rows: readonly Row[],
  suffix?: string,
) {
  const { uri } = await Print.printToFileAsync({
    html: buildPdfHtml(definition, rows),
    ...pageSize(definition.orientation),
  });
  const file = new File(Paths.cache, exportFileName(definition.fileBaseName, 'pdf', suffix));
  await new File(uri).move(file, { overwrite: true });
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    dialogTitle: definition.title,
  });
}

/** Generates the .xlsx and opens the share sheet. `suffix` is appended to the file name. */
export async function shareXlsx<Row>(
  definition: TableDefinition<Row>,
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
