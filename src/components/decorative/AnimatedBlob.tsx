"use client";

import { cn } from "@/lib/utils";

interface AnimatedBlobProps {
  className?: string;
  variant?: 1 | 2 | 3;
  size?: "sm" | "md" | "lg" | "xl";
}

// Using CSS animations instead of Framer Motion for better performance
export function AnimatedBlob({
  className,
  variant = 1,
  size = "lg",
}: AnimatedBlobProps) {
  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-72 h-72",
    xl: "w-96 h-96",
  };

  const gradientClasses = {
    1: "gradient-blob-1",
    2: "gradient-blob-2",
    3: "gradient-blob-3",
  };

  return (
    <div
      className={cn(
        "absolute rounded-full blur-3xl opacity-20 pointer-events-none blob-animation will-change-transform",
        sizeClasses[size],
        gradientClasses[variant],
        className
      )}
      style={{
        animationDelay: `${variant * -2}s`,
      }}
    />
  );
}

