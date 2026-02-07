"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { motion } from 'framer-motion'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface PerformanceData {
  name: string;
  leads: number;
  fechados: number;
}

interface BarChartMultipleProps {
  data: PerformanceData[];
}

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
  fechados: {
    label: "Fechados",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function BarChartMultiple({ data }: BarChartMultipleProps) {
  const totalLeads = data.reduce((sum, item) => sum + item.leads, 0)
  const totalFechados = data.reduce((sum, item) => sum + item.fechados, 0)
  const conversionRate = totalLeads > 0 ? ((totalFechados / totalLeads) * 100).toFixed(1) : '0'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Performance de Vendas</CardTitle>
          <CardDescription>Total de leads vs fechados no período</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="leads" fill="var(--color-leads)" radius={4} />
              <Bar dataKey="fechados" fill="var(--color-fechados)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            Taxa de conversão: {conversionRate}% <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Mostrando {totalLeads} leads e {totalFechados} fechados no período
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
