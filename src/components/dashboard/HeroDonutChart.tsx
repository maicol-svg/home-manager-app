"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Gradient-friendly colors
const COLORS = [
  "#60a5fa", // Blue
  "#818cf8", // Indigo
  "#a78bfa", // Violet
  "#e879f9", // Fuchsia
  "#fb7185", // Rose
  "#fdba74", // Peach
  "#fde047", // Yellow
  "#86efac", // Green
];

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface HeroDonutChartProps {
  data: ChartData[];
  total: number;
  formatTotal?: (value: number) => string;
  subtitle?: string;
  onSegmentClick?: (data: ChartData) => void;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-card border border-border rounded-xl shadow-lg p-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="font-medium text-sm text-foreground">{data.name}</span>
        </div>
        <p className="text-lg font-bold mt-1 text-foreground">
          {new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
          }).format(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export function HeroDonutChart({
  data,
  total,
  formatTotal,
  subtitle = "Totale Mese",
  onSegmentClick,
}: HeroDonutChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
  }));

  const formattedTotal = formatTotal
    ? formatTotal(total)
    : new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(total);

  // Check if there's no data
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-40 h-40 rounded-full bg-muted/50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{formattedTotal}</p>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Nessuna spesa registrata questo mese
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Chart Container */}
      <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              animationDuration={300}
              animationEasing="ease-out"
              onClick={(data) => onSegmentClick?.(data)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="transparent"
                  className="cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Content */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {formattedTotal}
          </p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-4 px-4">
        {chartData.map((entry) => (
          <button
            key={entry.name}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-accent/50 transition-colors"
            onClick={() => onSegmentClick?.(entry)}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
