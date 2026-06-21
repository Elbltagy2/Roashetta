import { db } from '../database/config';

export interface Drug {
  id: number;
  commercialNameEn: string | null;
  commercialNameAr: string | null;
  scientificName: string | null;
  manufacturer: string | null;
  drugClass: string | null;
  route: string | null;
  priceEgp: number | null;
}

export class DrugRepository {
  // Search the Egyptian drug database by commercial (en/ar) or scientific name.
  // Prefix matches are ranked first so typing "amox" surfaces "AMOXICILLIN..."
  // before names that merely contain the term. Returns at most `limit` rows.
  search(query: string, limit = 30): Drug[] {
    const q = query.trim();
    if (q.length < 2) return [];

    const contains = `%${q}%`;
    const prefix = `${q}%`;

    const rows = db.prepare(`
      SELECT id, commercial_name_en, commercial_name_ar, scientific_name,
             manufacturer, drug_class, route, price_egp
      FROM drugs
      WHERE commercial_name_en LIKE ? COLLATE NOCASE
         OR commercial_name_ar LIKE ?
         OR scientific_name LIKE ? COLLATE NOCASE
      ORDER BY
        CASE
          WHEN commercial_name_en LIKE ? COLLATE NOCASE THEN 0
          WHEN scientific_name LIKE ? COLLATE NOCASE THEN 1
          ELSE 2
        END,
        commercial_name_en
      LIMIT ?
    `).all(contains, contains, contains, prefix, prefix, limit) as Record<string, unknown>[];

    return rows.map(this.mapToEntity);
  }

  private mapToEntity(row: Record<string, unknown>): Drug {
    return {
      id: row.id as number,
      commercialNameEn: row.commercial_name_en as string | null,
      commercialNameAr: row.commercial_name_ar as string | null,
      scientificName: row.scientific_name as string | null,
      manufacturer: row.manufacturer as string | null,
      drugClass: row.drug_class as string | null,
      route: row.route as string | null,
      priceEgp: typeof row.price_egp === 'number' ? row.price_egp : null,
    };
  }
}
