"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Receipt,
  Users,
  Trash2,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { ProfileSlidePanel } from "@/components/profile/ProfileSlidePanel";
import { SwipeNavigator } from "@/components/navigation/SwipeNavigator";
import { cn } from "@/lib/utils";

interface LayoutClientProps {
  children: React.ReactNode;
  user: {
    email: string;
    displayName: string;
    initials: string;
  };
  household: {
    name: string;
    inviteCode: string;
  };
}

// Only 5 working tabs (Calendario excluded)
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Spese", href: "/spese", icon: Receipt },
  { name: "Turni", href: "/turni", icon: Users },
  { name: "Rifiuti", href: "/rifiuti", icon: Trash2 },
  { name: "Bollette", href: "/bollette", icon: FileText },
];

export function LayoutClient({ children, user, household }: LayoutClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Get current tab index for indicator dots
  const currentIndex = navigation.findIndex((tab) =>
    pathname === tab.href || pathname.startsWith(tab.href + "/")
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border hidden lg:flex lg:flex-col">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-6 py-5 border-b border-border hover:bg-accent/50 transition-colors"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground">Housy</span>
            <p className="text-xs text-muted-foreground">Gestione Casa</p>
          </div>
        </Link>

        <div className="px-4 py-4 border-b border-border">
          <div className="bg-accent/50 rounded-xl p-3">
            <p className="text-sm font-semibold text-foreground truncate">
              {household.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Codice:</span>
              <code className="text-xs font-mono bg-background px-2 py-0.5 rounded text-primary">
                {household.inviteCode}
              </code>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-full flex items-center gap-3 mb-4 p-2 -m-2 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {user.initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </button>
          <div className="flex gap-2">
            <Link
              href="/impostazioni"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-muted-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Impostazioni</span>
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center justify-center px-3 py-2.5 text-sm text-destructive bg-destructive/10 rounded-xl hover:bg-destructive/20 transition-colors"
                title="Esci"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">Housy</span>
          </Link>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user.initials}
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 pb-24 lg:pb-0">
        <SwipeNavigator>
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </SwipeNavigator>
      </main>

      {/* Mobile Bottom Navigation - SOLID background */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
        {/* Swipe indicator dots */}
        <div className="flex justify-center gap-1.5 pt-2 pb-1">
          {navigation.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/20 w-1.5"
              )}
            />
          ))}
        </div>
        {/* Tab navigation */}
        <div className="flex items-center justify-around py-2 pb-3">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[4rem]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-primary"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile Slide Panel */}
      <ProfileSlidePanel
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        household={household}
      />
    </div>
  );
}
