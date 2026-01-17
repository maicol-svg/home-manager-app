"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Pastel colors for charts
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

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface AnimatedPieChartProps {
  data: PieChartData[];
  title?: string;
  description?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
  formatValue?: (value: number) => string;
}

const CustomTooltip = ({
  active,
  payload,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
  formatValue?: (value: number) => string;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg shadow-lg p-3"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="font-medium text-sm">{data.name}</span>
        </div>
        <p className="text-lg font-bold mt-1">
          {formatValue ? formatValue(data.value) : data.value}
        </p>
      </motion.div>
    );
  }
  return null;
};

const CustomLegend = ({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) => {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry, index) => (
        <motion.div
          key={entry.value}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </motion.div>
      ))}
    </div>
  );
};

export function AnimatedPieChart({
  data,
  title,
  description,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
  height = 300,
  formatValue,
}: AnimatedPieChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
  }));

  const content = (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              stroke="transparent"
              className="transition-opacity hover:opacity-80 cursor-pointer"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
        {showLegend && <Legend content={<CustomLegend />} />}
      </PieChart>
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

// Donut chart variant with center text
interface DonutChartProps extends AnimatedPieChartProps {
  centerText?: string;
  centerValue?: string | number;
}

export function AnimatedDonutChart({
  data,
  title,
  description,
  centerText,
  centerValue,
  showLegend = true,
  innerRadius = 70,
  outerRadius = 100,
  height = 300,
  formatValue,
}: DonutChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
  }));

  const content = (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="transparent"
                className="transition-opacity hover:opacity-80 cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
          {showLegend && <Legend content={<CustomLegend />} />}
        </PieChart>
      </ResponsiveContainer>
      {(centerText || centerValue) && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          style={{ marginTop: showLegend ? -20 : 0 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {centerValue && (
            <p className="text-2xl font-bold text-foreground">{centerValue}</p>
          )}
          {centerText && (
            <p className="text-sm text-muted-foreground">{centerText}</p>
          )}
        </motion.div>
      )}
    </div>
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
