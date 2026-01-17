"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: "sm" | "default" | "lg";
  animated?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      color,
      showLabel = false,
      size = "default",
      animated = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-1.5",
      default: "h-2.5",
      lg: "h-4",
    };

    return (
      <div className="w-full">
        {showLabel && (
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-foreground">
              Progresso
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "w-full overflow-hidden rounded-full bg-secondary",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {animated ? (
            <motion.div
              className={cn("h-full rounded-full", !color && "bg-primary")}
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          ) : (
            <div
              className={cn("h-full rounded-full transition-all", !color && "bg-primary")}
              style={{
                width: `${percentage}%`,
                backgroundColor: color,
              }}
            />
          )}
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

// XP Progress Bar with level indicator
interface XPProgressProps {
  currentXP: number;
  levelXP: number;
  level: number;
  className?: string;
}

const XPProgress = ({ currentXP, levelXP, level, className }: XPProgressProps) => {
  const percentage = (currentXP / levelXP) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {level}
          </div>
          <span className="text-sm font-medium text-foreground">
            Livello {level}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {currentXP} / {levelXP} XP
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 1,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30"
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: `${percentage}%`,
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
};

export { Progress, XPProgress };
