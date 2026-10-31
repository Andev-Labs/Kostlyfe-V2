"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

/** Select yang menyimpan nilainya di query string (?param=value). Nilai "" menghapus param. */
export function UrlSelect({
  param,
  options,
  value,
  label,
}: {
  param: string;
  options: { value: string; label: string }[];
  value: string;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <NativeSelect
      aria-label={label}
      size="sm"
      value={value}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        if (e.target.value) params.set(param, e.target.value);
        else params.delete(param);
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      {options.map((o) => (
        <NativeSelectOption key={o.value} value={o.value}>
          {o.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
