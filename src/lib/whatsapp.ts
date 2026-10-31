/** 0812-xxx / +62 812 / 62812 → 62812xxx. Null bila tidak valid. */
export function normalizePhone(phone: string | null | undefined) {
  if (!phone) return null;
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  return digits.length >= 10 ? digits : null;
}

export function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

export function waLink(phone: string | null | undefined, message: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
