"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

const fmt = new Intl.NumberFormat("id-ID");

/** Input Rupiah dengan pemisah ribuan; nilai yang dikirim tetap berformat "1.500.000" (di-parse server). */
export function MoneyInput({
  defaultValue,
  value,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "defaultValue" | "onChange"> & {
  defaultValue?: number | null;
  value?: number;
  onValueChange?: (value: number) => void;
}) {
  const [inner, setInner] = useState(defaultValue ? fmt.format(defaultValue) : "");
  const shown = value !== undefined ? (value ? fmt.format(value) : "") : inner;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
        Rp
      </span>
      <Input
        {...props}
        inputMode="numeric"
        className="pl-9"
        value={shown}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "");
          const n = digits ? Number(digits) : 0;
          setInner(digits ? fmt.format(n) : "");
          onValueChange?.(n);
        }}
      />
    </div>
  );
}
