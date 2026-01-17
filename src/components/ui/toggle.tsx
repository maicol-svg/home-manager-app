"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: {
    track: "w-8 h-5",
    thumb: "w-3 h-3",
    translate: "translate-x-4",
  },
  md: {
    track: "w-11 h-6",
    thumb: "w-4 h-4",
    translate: "translate-x-5",
  },
  lg: {
    track: "w-14 h-8",
    thumb: "w-6 h-6",
    translate: "translate-x-6",
  },
};

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
}: ToggleProps) {
  const config = sizeConfig[size];

  return (
    <label
      className={cn(
        "flex items-center gap-3 cursor-pointer select-none",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          config.track,
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <motion.span
          className={cn(
            "pointer-events-none rounded-full bg-white shadow-md ring-0",
            config.thumb
          )}
          initial={false}
          animate={{
            x: checked ? (size === "sm" ? 14 : size === "md" ? 20 : 24) : 2,
            y: size === "sm" ? 4 : size === "md" ? 4 : 4,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}

// Simple switch without label, for use in tables/lists
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Switch({ checked, onChange, disabled = false, size = "sm" }: SwitchProps) {
  return (
    <Toggle
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      size={size}
    />
  );
}
