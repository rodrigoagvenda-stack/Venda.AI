"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { motion } from 'framer-motion'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  type ChartConfig,
} from "@/components/ui/chart"

interface ConversionData {
  name: string;
  value: number;
  color: string;
}

interface PieChartDonutActiveProps {
  data: ConversionData[];
}

export function PieChartDonutActive({ data }: PieChartDonutActiveProps) {
  const chartData = data.map((item) => ({
    category: item.name.toLowerCase().replace(/\s+/g, '_'),
    value: item.value,
    fill: item.color,
  }))

  const chartConfig: ChartConfig = {
    value: {
      label: "Leads",
    },
    ...Object.fromEntries(
      data.map((item) => [
        item.name.toLowerCase().replace(/\s+/g, '_'),
        {
          label: item.name,
          color: item.color,
        },
      ])
    ),
  }

  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-0">
          <CardTitle>Taxa de conversão geral</CardTitle>
          <CardDescription>Distribuição de leads</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[325px]"
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="category"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalValue.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Leads
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <ChartLegend
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  return (
                    <div className="flex items-center justify-center gap-6 pt-4">
                      {payload.map((item: any, index: number) => {
                        const dataItem = data[index];
                        return (
                          <div key={item.value} className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-sm"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {dataItem?.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
