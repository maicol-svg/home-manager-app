"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Pastel colors
const COLORS = [
  "#93c5fd", // Blue pastel
  "#a5b4fc", // Indigo pastel
  "#c4b5fd", // Violet pastel
  "#f0abfc", // Fuchsia pastel
  "#fda4af", // Rose pastel
  "#fed7aa", // Peach pastel
  "#fef08a", // Yellow pastel
  "#bbf7d0", // Green pastel
];

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface AnimatedBarChartProps {
  data: BarChartData[];
  title?: string;
  description?: string;
  height?: number;
  formatValue?: (value: number) => string;
  showGrid?: boolean;
  horizontal?: boolean;
  barColor?: string;
  gradientBar?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatValue?: (value: number) => string;
}) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg shadow-lg p-3"
      >
        <p className="font-medium text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">
          {formatValue ? formatValue(payload[0].value) : payload[0].value}
        </p>
      </motion.div>
    );
  }
  return null;
};

export function AnimatedBarChart({
  data,
  title,
  description,
  height = 300,
  formatValue,
  showGrid = true,
  horizontal = false,
  barColor,
  gradientBar = false,
}: AnimatedBarChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || barColor || COLORS[index % COLORS.length],
  }));

  const content = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        {gradientBar && (
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        )}
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.5}
            vertical={false}
          />
        )}
        {horizontal ? (
          <>
            <XAxis
              type="number"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
          </>
        )}
        <Tooltip
          content={<CustomTooltip formatValue={formatValue} />}
          cursor={{ fill: "var(--accent)", opacity: 0.5 }}
        />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
          fill={gradientBar ? "url(#barGradient)" : undefined}
        >
          {!gradientBar &&
            chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="transition-opacity hover:opacity-80 cursor-pointer"
              />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (title) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return content;
}

// Mini sparkline bar chart
interface SparklineBarProps {
  data: number[];
  color?: string;
  height?: number;
}

export function SparklineBar({ data, color = "#0ea5e9", height = 40 }: SparklineBarProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Bar
          dataKey="value"
          fill={color}
          radius={[2, 2, 0, 0]}
          animationDuration={500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
