import { describe, expect, it } from "vitest";
import { addMonths, currentMonthISO, monthLabel, parseRupiah, rupiah, todayISO } from "@/lib/format";
import { fillTemplate, normalizePhone, waLink } from "@/lib/whatsapp";
import { monthsCovered, paidThrough, splitInstallments } from "@/lib/billing";

describe("format", () => {
  it("formats and parses rupiah", () => {
    expect(rupiah(1500000)).toBe("Rp 1.500.000");
    expect(parseRupiah("Rp 1.500.000")).toBe(1500000);
    expect(parseRupiah("")).toBe(0);
  });

  it("uses Asia/Jakarta for today", () => {
    // 2026-10-31 18:00 UTC = 2026-11-01 01:00 WIB
    const d = new Date("2026-10-31T18:00:00Z");
    expect(todayISO(d)).toBe("2026-11-01");
    expect(currentMonthISO(d)).toBe("2026-11-01");
  });

  it("adds months across year boundary", () => {
    expect(addMonths("2026-11-01", 3)).toBe("2027-02-01");
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
  });

  it("labels months in Indonesian", () => {
    expect(monthLabel("2026-10-01")).toBe("Oktober 2026");
  });
});

describe("whatsapp", () => {
  it("normalizes Indonesian numbers", () => {
    expect(normalizePhone("0812-3456-7890")).toBe("6281234567890");
    expect(normalizePhone("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizePhone("812345678901")).toBe("62812345678901");
    expect(normalizePhone("123")).toBeNull();
  });

  it("fills template and builds link", () => {
    const msg = fillTemplate("Halo {nama}, {x}", { nama: "Budi" });
    expect(msg).toBe("Halo Budi, {x}");
    expect(waLink("08123456789", "hi there")).toBe("https://wa.me/628123456789?text=hi%20there");
    expect(waLink(null, "x")).toBeNull();
  });
});

describe("billing", () => {
  it("computes paid-through month", () => {
    expect(paidThrough({ start_date: "2026-07-15", first_unpaid_month: "2026-07-01", last_invoice_month: "2026-10-01" })).toBeNull();
    expect(paidThrough({ start_date: "2026-07-15", first_unpaid_month: "2026-10-01", last_invoice_month: "2026-10-01" })).toBe("2026-09-01");
    expect(paidThrough({ start_date: "2026-07-15", first_unpaid_month: null, last_invoice_month: "2026-12-01" })).toBe("2026-12-01");
  });

  it("lists covered months", () => {
    expect(monthsCovered("2026-11-01", 3)).toEqual(["2026-11-01", "2026-12-01", "2027-01-01"]);
  });

  it("splits installments like SQL", () => {
    expect(splitInstallments(1000001, 3)).toEqual([333333, 333333, 333335]);
    expect(splitInstallments(900000, 3)).toEqual([300000, 300000, 300000]);
  });
});
