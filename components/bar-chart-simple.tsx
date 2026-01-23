"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

type ChartItem = {
  date: string
  value: number
}

export function BarChartSimple({
  data,
  label,
  color,
}: {
  data: ChartItem[]
  label: string
  color: string
}) {
  const chartConfig = {
    value: {
      label,
      color,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[240px] w-full rounded-xl border bg-white p-4"
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
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  )
}
