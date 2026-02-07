"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { motion } from 'framer-motion';

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

interface BarChartCustomProps {
  data: PerformanceData[];
}

const chartConfig = {
  leads: {
    label: "Leads",
    color: "var(--chart-2)",
  },
  fechados: {
    label: "Fechados",
    color: "var(--chart-1)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function BarChartCustom({ data }: BarChartCustomProps) {
  const totalLeads = data.reduce((sum, item) => sum + item.leads, 0);
  const totalFechados = data.reduce((sum, item) => sum + item.fechados, 0);
  const conversionRate = totalLeads > 0 ? ((totalFechados / totalLeads) * 100).toFixed(1) : '0';

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
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{
                right: 16,
              }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <XAxis dataKey="leads" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey="leads"
                layout="vertical"
                fill="var(--color-leads)"
                radius={4}
              >
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  offset={8}
                  className="fill-[--color-label]"
                  fontSize={12}
                />
                <LabelList
                  dataKey="leads"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            Taxa de conversão: {conversionRate}% <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Mostrando {totalLeads} leads e {totalFechados} fechados no período
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
