"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { type PieSectorDataItem } from "recharts/types/polar/Pie"
import { motion } from 'framer-motion';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ConversionData {
  name: string;
  value: number;
  color: string;
}

interface PieChartInteractiveProps {
  data: ConversionData[];
}

export function PieChartInteractive({ data }: PieChartInteractiveProps) {
  const id = "pie-interactive"

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

  const [activeCategory, setActiveCategory] = React.useState(
    chartData[0]?.category || ""
  )

  const activeIndex = React.useMemo(
    () => chartData.findIndex((item) => item.category === activeCategory),
    [activeCategory, chartData]
  )

  const categories = React.useMemo(() => chartData.map((item) => item.category), [chartData])

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0)
  const activeData = chartData[activeIndex] || chartData[0]
  const percentage = totalValue > 0 ? Math.round((activeData.value / totalValue) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
    >
      <Card data-chart={id} className="flex flex-col">
        <ChartStyle id={id} config={chartConfig} />
        <CardHeader className="flex-row items-start space-y-0 pb-0">
          <div className="grid gap-1">
            <CardTitle>Taxa de conversão geral</CardTitle>
            <CardDescription>Distribuição de leads</CardDescription>
          </div>
          {chartData.length > 1 && (
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger
                className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
                aria-label="Selecionar categoria"
              >
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl">
                {categories.map((key) => {
                  const config = chartConfig[key as keyof typeof chartConfig]

                  if (!config) {
                    return null
                  }

                  return (
                    <SelectItem
                      key={key}
                      value={key}
                      className="rounded-lg [&_span]:flex"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className="flex h-3 w-3 shrink-0 rounded-xs"
                          style={{
                            backgroundColor: `var(--color-${key})`,
                          }}
                        />
                        {config?.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
        </CardHeader>
        <CardContent className="flex flex-1 justify-center pb-0">
          <ChartContainer
            id={id}
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="category"
                innerRadius={60}
                strokeWidth={5}
                activeIndex={activeIndex}
                activeShape={({
                  outerRadius = 0,
                  ...props
                }: PieSectorDataItem) => (
                  <g>
                    <Sector {...props} outerRadius={outerRadius + 10} />
                    <Sector
                      {...props}
                      outerRadius={outerRadius + 25}
                      innerRadius={outerRadius + 12}
                    />
                  </g>
                )}
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
                            {percentage}%
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            {chartConfig[activeCategory]?.label || "Taxa"}
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
