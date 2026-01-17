"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Tab {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface SwipeIndicatorProps {
  tabs: Tab[];
  currentPath: string;
  className?: string;
}

export function SwipeIndicator({ tabs, currentPath, className }: SwipeIndicatorProps) {
  const currentIndex = tabs.findIndex((tab) => currentPath.startsWith(tab.href));

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {tabs.map((tab, index) => {
        const isActive = currentPath.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex items-center justify-center"
          >
            <motion.div
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                isActive ? "bg-primary" : "bg-muted-foreground/30"
              )}
              animate={{
                scale: isActive ? 1.2 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            {/* Active indicator background */}
            {isActive && (
              <motion.div
                className="absolute inset-0 -m-1 bg-primary/10 rounded-full"
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}

// Desktop Arrow Navigation
interface DesktopArrowNavProps {
  tabs: Tab[];
  currentPath: string;
  onNavigate: (direction: "prev" | "next") => void;
}

export function DesktopArrowNav({ tabs, currentPath, onNavigate }: DesktopArrowNavProps) {
  const currentIndex = tabs.findIndex((tab) => currentPath.startsWith(tab.href));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < tabs.length - 1;

  return (
    <>
      {/* Left Arrow */}
      {hasPrev && (
        <motion.button
          className="fixed left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm shadow-soft-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors opacity-0 hover:opacity-100"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0 }}
          whileHover={{ opacity: 1, x: 0 }}
          onClick={() => onNavigate("prev")}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </motion.button>
      )}

      {/* Right Arrow */}
      {hasNext && (
        <motion.button
          className="fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm shadow-soft-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors opacity-0 hover:opacity-100"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0 }}
          whileHover={{ opacity: 1, x: 0 }}
          onClick={() => onNavigate("next")}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.button>
      )}
    </>
  );
}
