const rupiahFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function rupiah(value: number | null | undefined) {
  return rupiahFmt.format(value ?? 0).replace(/ /g, " ");
}

/** Parse "1.500.000", "1500000", "Rp 1.500.000" → 1500000 */
export function parseRupiah(input: FormDataEntryValue | string | null | undefined) {
  const digits = String(input ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

/** Tanggal ISO (yyyy-mm-dd) hari ini di zona Asia/Jakarta. */
export function todayISO(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
}

/** yyyy-mm-01 untuk bulan berjalan (Asia/Jakarta). */
export function currentMonthISO(now: Date = new Date()) {
  return `${todayISO(now).slice(0, 7)}-01`;
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d || 1));
}

export function addMonths(isoMonth: string, n: number) {
  const d = parseISODate(isoMonth);
  d.setUTCMonth(d.getUTCMonth() + n, 1);
  return d.toISOString().slice(0, 10);
}

export function monthLabel(iso: string | null | undefined, style: "long" | "short" = "long") {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", { month: style, year: "numeric", timeZone: "UTC" }).format(
    parseISODate(iso),
  );
}

export function dateLabel(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseISODate(iso));
}

/** Selisih hari (b - a) untuk tanggal ISO. */
export function daysBetween(a: string, b: string) {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);
}
