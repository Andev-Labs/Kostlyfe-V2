"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { rupiah } from "@/lib/format";

const config = {
  income: { label: "Pemasukan", color: "oklch(0.696 0.17 162.48)" },
  expense: { label: "Pengeluaran", color: "oklch(0.645 0.246 16.439)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

export function CashflowChart({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => compact.format(v)} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => (
          <div className="flex w-full justify-between gap-4">
            <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
            <span className="font-mono font-medium">{rupiah(Number(value))}</span>
          </div>
        )} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
