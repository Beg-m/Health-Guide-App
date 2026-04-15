import rawMedicines from "./medicines_final.json";

export type MedicineMode = "basic" | "medical";

export interface MedicineRecord {
  id: string;
  name: string;
  activeIngredient: string;
  basicUsage?: string;
  basicDosage?: string;
  basicSideEffects?: string;
  basicWarnings?: string;
  medicalUsage?: string;
  medicalDosage?: string;
  medicalSideEffects?: string;
  medicalWarnings?: string;
  interactions?: string;
  /** Legacy fields (some JSON rows) */
  usage?: string;
  dosage?: string;
  sideEffects?: string;
  warnings?: string;
}

export const MEDICINES: MedicineRecord[] = rawMedicines as MedicineRecord[];

export function getMedicineById(id: string): MedicineRecord | undefined {
  return MEDICINES.find((m) => m.id === id);
}

/** Text used for search matching across common content fields. */
export function medicineSearchHaystack(m: MedicineRecord): string {
  return [
    m.name,
    m.activeIngredient,
    m.basicUsage,
    m.basicDosage,
    m.basicSideEffects,
    m.basicWarnings,
    m.medicalUsage,
    m.medicalDosage,
    m.medicalSideEffects,
    m.medicalWarnings,
    m.interactions,
    m.usage,
    m.dosage,
    m.sideEffects,
    m.warnings,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Turkish-aware lowercase for case-insensitive search */
export function normalizeForSearch(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

function medicineMatchesQuery(m: MedicineRecord, queryNormalized: string): boolean {
  if (!queryNormalized) return false;
  return normalizeForSearch(medicineSearchHaystack(m)).includes(queryNormalized);
}

/** Sort A–Z by name (Turkish collation). */
export function sortMedicinesByName(medicines: MedicineRecord[]): MedicineRecord[] {
  return [...medicines].sort((a, b) =>
    a.name.localeCompare(b.name, "tr", { sensitivity: "base" })
  );
}

/** Filter medicines by name / content fields (Turkish locale, case-insensitive). Always returns A–Z by name. */
export function filterMedicinesBySearch(query: string): MedicineRecord[] {
  const q = query.trim();
  if (!q) {
    return sortMedicinesByName([...MEDICINES]);
  }
  const nq = normalizeForSearch(q);
  return sortMedicinesByName(MEDICINES.filter((m) => medicineMatchesQuery(m, nq)));
}

export function truncateText(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen).trim()}…`;
}
