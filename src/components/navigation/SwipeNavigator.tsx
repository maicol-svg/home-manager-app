"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const TABS = ["/dashboard", "/spese", "/turni", "/rifiuti", "/bollette"] as const;
const SWIPE_THRESHOLD = 50; // Minimum pixels to trigger navigation
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger navigation

interface SwipeNavigatorProps {
  children: React.ReactNode;
}

export function SwipeNavigator({ children }: SwipeNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentTranslate = useRef(0);
  const isSwipingHorizontally = useRef<boolean | null>(null);

  // Animation state
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

  // Get current tab index
  const currentIndex = TABS.findIndex(tab => pathname === tab || pathname.startsWith(tab + "/"));
  const canSwipeLeft = currentIndex < TABS.length - 1;
  const canSwipeRight = currentIndex > 0;

  // Reset animation state when pathname changes
  useEffect(() => {
    setTranslateX(0);
    setIsAnimating(false);
    setExitDirection(null);
  }, [pathname]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    currentTranslate.current = 0;
    isSwipingHorizontally.current = null;
  }, [isAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Determine swipe direction on first significant movement
    if (isSwipingHorizontally.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isSwipingHorizontally.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    // Only handle horizontal swipes
    if (!isSwipingHorizontally.current) return;

    // Check if we can swipe in this direction
    const isSwipingToLeft = deltaX < 0;
    const isSwipingToRight = deltaX > 0;

    if ((isSwipingToLeft && !canSwipeLeft) || (isSwipingToRight && !canSwipeRight)) {
      // Add resistance when swiping at edges
      currentTranslate.current = deltaX * 0.2;
    } else {
      currentTranslate.current = deltaX;
    }

    setTranslateX(currentTranslate.current);
  }, [isAnimating, canSwipeLeft, canSwipeRight]);

  const handleTouchEnd = useCallback(() => {
    if (isAnimating || !isSwipingHorizontally.current) {
      setTranslateX(0);
      isSwipingHorizontally.current = null;
      return;
    }

    const deltaX = currentTranslate.current;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = Math.abs(deltaX) / deltaTime;

    const shouldNavigate = Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;
    const isSwipingToLeft = deltaX < 0;

    if (shouldNavigate) {
      if (isSwipingToLeft && canSwipeLeft) {
        // Swipe left -> go to next tab
        setIsAnimating(true);
        setExitDirection("left");
        setTranslateX(-window.innerWidth);

        setTimeout(() => {
          router.push(TABS[currentIndex + 1]);
        }, 200);
      } else if (!isSwipingToLeft && canSwipeRight) {
        // Swipe right -> go to previous tab
        setIsAnimating(true);
        setExitDirection("right");
        setTranslateX(window.innerWidth);

        setTimeout(() => {
          router.push(TABS[currentIndex - 1]);
        }, 200);
      } else {
        // Can't navigate, spring back
        setTranslateX(0);
      }
    } else {
      // Below threshold, spring back
      setTranslateX(0);
    }

    isSwipingHorizontally.current = null;
  }, [isAnimating, canSwipeLeft, canSwipeRight, currentIndex, router]);

  // Only enable on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`${isAnimating || translateX !== 0 ? "" : ""}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isAnimating || translateX === 0 ? "transform 0.2s ease-out" : "none",
          willChange: translateX !== 0 ? "transform" : "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
