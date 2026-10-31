import { asc, eq, sql } from 'drizzle-orm';

import type { SyncDatabase } from '@/core/db/types';

import { hygieneTemplates, type HygieneTemplate } from './schema';

/** Values of a template, already validated and normalized. */
export type TemplateInput = {
  action: string;
  productiveUnit: string;
  place: string;
  /** May contain `{año}`. */
  result: string;
  correctiveMeasures: string | null;
  /** May contain `{año}`. */
  dateText: string;
  active: boolean;
};

const byOrder = [asc(hygieneTemplates.sortOrder), asc(hygieneTemplates.id)];

/** All templates in the order chosen by the user. */
export function listTemplates(db: SyncDatabase): HygieneTemplate[] {
  return db.select().from(hygieneTemplates).orderBy(...byOrder).all();
}

/** Templates used when generating a year. */
export function listActiveTemplates(db: SyncDatabase): HygieneTemplate[] {
  return db
    .select()
    .from(hygieneTemplates)
    .where(eq(hygieneTemplates.active, true))
    .orderBy(...byOrder)
    .all();
}

export function getTemplate(db: SyncDatabase, id: number): HygieneTemplate | undefined {
  return db.select().from(hygieneTemplates).where(eq(hygieneTemplates.id, id)).get();
}

/** Creates (no `id`, added at the end) or updates a template. Saved rows do not change. */
export function saveTemplate(db: SyncDatabase, input: TemplateInput, id?: number): HygieneTemplate {
  if (id !== undefined) {
    const saved: HygieneTemplate | undefined = db
      .update(hygieneTemplates)
      .set({ ...input, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(hygieneTemplates.id, id))
      .returning()
      .get();
    if (!saved) throw new Error(`Template ${id} not found`);
    return saved;
  }
  const row: { max: number | null } | undefined = db
    .select({ max: sql<number | null>`max(${hygieneTemplates.sortOrder})` })
    .from(hygieneTemplates)
    .get();
  return db
    .insert(hygieneTemplates)
    .values({ ...input, sortOrder: (row?.max ?? -1) + 1 })
    .returning()
    .get();
}

/** Rows created from it keep their texts; their link becomes null. */
export function deleteTemplate(db: SyncDatabase, id: number): void {
  db.delete(hygieneTemplates).where(eq(hygieneTemplates.id, id)).run();
}

/** Swaps the template with its previous (`-1`) or next (`1`) neighbour. No-op at the ends. */
export function moveTemplate(db: SyncDatabase, id: number, direction: -1 | 1): void {
  db.transaction((tx) => {
    const templates = listTemplates(tx);
    const index = templates.findIndex((template) => template.id === id);
    const other = templates[index + direction];
    if (index < 0 || !other) return;
    // Renumber so equal sort orders cannot block the swap.
    const reordered = [...templates];
    [reordered[index], reordered[index + direction]] = [other, templates[index]];
    reordered.forEach((template, sortOrder) => {
      tx.update(hygieneTemplates)
        .set({ sortOrder })
        .where(eq(hygieneTemplates.id, template.id))
        .run();
    });
  });
}
