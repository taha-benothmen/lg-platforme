"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

/* ================= Types ================= */

type ChartItem = {
  date: string
  devis: number
  revenue: number
}

/* ================= Config ================= */

const chartConfig = {
  devis: {
    label: "Devis",
    color: "#2563eb",
  },
  revenue: {
    label: "Chiffre d’affaires",
    color: "#16a34a",
  },
} satisfies ChartConfig

/* ================= Component ================= */

export function ChartAreaInteractive({ data }: { data: ChartItem[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[260px] w-full rounded-xl border bg-white p-4"
    >
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(5)}
        />

        {/* Devis */}
        <Bar
          dataKey="devis"
          fill="var(--color-devis)"
          radius={4}
        />

        {/* Revenue */}
        <Bar
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  )
}
