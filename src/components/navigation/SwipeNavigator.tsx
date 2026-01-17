"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const TABS = ["/dashboard", "/spese", "/turni", "/rifiuti", "/bollette"] as const;
const SWIPE_THRESHOLD = 40; // Minimum pixels to trigger navigation
const SWIPE_VELOCITY_THRESHOLD = 0.25; // Minimum velocity to trigger navigation
const ANIMATION_DURATION = 150; // Faster animation

interface SwipeNavigatorProps {
  children: React.ReactNode;
}

// Store navigation direction for entry animation
export function setNavigationDirection(direction: "left" | "right") {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("nav-direction", direction);
  }
}

export function getNavigationDirection(): "left" | "right" | null {
  if (typeof window !== "undefined") {
    const dir = sessionStorage.getItem("nav-direction") as "left" | "right" | null;
    sessionStorage.removeItem("nav-direction");
    return dir;
  }
  return null;
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
  const [entryAnimation, setEntryAnimation] = useState<string | null>(null);

  // Get current tab index
  const currentIndex = TABS.findIndex(tab => pathname === tab || pathname.startsWith(tab + "/"));
  const canSwipeLeft = currentIndex < TABS.length - 1;
  const canSwipeRight = currentIndex > 0;

  // Handle entry animation when pathname changes
  useEffect(() => {
    const direction = getNavigationDirection();
    if (direction) {
      // New page should enter from the opposite side
      // If we navigated "left" (to next), new page enters from right
      // If we navigated "right" (to prev), new page enters from left
      setEntryAnimation(direction === "left" ? "enter-from-right" : "enter-from-left");

      // Clear animation after it completes
      const timer = setTimeout(() => {
        setEntryAnimation(null);
      }, ANIMATION_DURATION);

      return () => clearTimeout(timer);
    }

    setTranslateX(0);
    setIsAnimating(false);
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
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
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
      currentTranslate.current = deltaX * 0.15;
    } else {
      currentTranslate.current = deltaX * 0.8; // Slight resistance for feel
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
        setNavigationDirection("left");
        setTranslateX(-window.innerWidth * 0.3); // Partial exit for speed

        setTimeout(() => {
          router.push(TABS[currentIndex + 1]);
        }, ANIMATION_DURATION * 0.6);
      } else if (!isSwipingToLeft && canSwipeRight) {
        // Swipe right -> go to previous tab
        setIsAnimating(true);
        setNavigationDirection("right");
        setTranslateX(window.innerWidth * 0.3); // Partial exit for speed

        setTimeout(() => {
          router.push(TABS[currentIndex - 1]);
        }, ANIMATION_DURATION * 0.6);
      } else {
        setTranslateX(0);
      }
    } else {
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

  // Entry animation classes
  const getAnimationStyle = () => {
    if (entryAnimation === "enter-from-right") {
      return {
        animation: `slideInFromRight ${ANIMATION_DURATION}ms ease-out forwards`,
      };
    }
    if (entryAnimation === "enter-from-left") {
      return {
        animation: `slideInFromLeft ${ANIMATION_DURATION}ms ease-out forwards`,
      };
    }
    if (translateX !== 0 || isAnimating) {
      return {
        transform: `translateX(${translateX}px)`,
        transition: isAnimating ? `transform ${ANIMATION_DURATION}ms ease-out` : "none",
      };
    }
    return {};
  };

  return (
    <div
      ref={containerRef}
      className="touch-pan-y overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={getAnimationStyle()}>
        {children}
      </div>
    </div>
  );
}
