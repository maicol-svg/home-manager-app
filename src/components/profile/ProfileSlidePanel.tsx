"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  X,
  User,
  Users,
  Bell,
  Moon,
  Sun,
  Settings,
  LogOut,
  Plus,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
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

export function ProfileSlidePanel({
  isOpen,
  onClose,
  user,
  household,
}: ProfileSlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check initial theme
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  // Copy invite code
  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  const menuSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profilo", href: "/impostazioni/profilo" },
        { icon: Users, label: "Gruppo Casa", href: "/impostazioni/gruppo" },
        { icon: Bell, label: "Notifiche", href: "/impostazioni/notifiche" },
      ],
    },
    {
      title: "Impostazioni",
      items: [
        { icon: Settings, label: "Impostazioni", href: "/impostazioni" },
      ],
    },
  ];

  const quickActions = [
    { icon: Plus, label: "Nuova Spesa", href: "/spese/nuova", color: "primary" },
    { icon: UserPlus, label: "Invita", action: copyInviteCode, color: "success" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-card shadow-soft-xl outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Menu</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                  aria-label="Chiudi menu"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* User Info */}
              <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25">
                    {user.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-foreground truncate">
                      {user.displayName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Casa:</span>
                      <span className="text-xs font-medium text-foreground">
                        {household.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Azioni rapide
                </p>
                <div className="flex gap-3">
                  {quickActions.map((action) => (
                    action.href ? (
                      <Link
                        key={action.label}
                        href={action.href}
                        onClick={onClose}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all",
                          action.color === "primary" &&
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                          action.color === "success" &&
                            "bg-success/10 text-success hover:bg-success/20"
                        )}
                      >
                        <action.icon className="w-4 h-4" />
                        <span className="text-sm">{action.label}</span>
                      </Link>
                    ) : (
                      <button
                        key={action.label}
                        onClick={action.action}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all",
                          action.color === "success" &&
                            "bg-success/10 text-success hover:bg-success/20"
                        )}
                      >
                        {copied && action.label === "Invita" ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="text-sm">Copiato!</span>
                          </>
                        ) : (
                          <>
                            <action.icon className="w-4 h-4" />
                            <span className="text-sm">{action.label}</span>
                          </>
                        )}
                      </button>
                    )
                  ))}
                </div>
              </div>

              {/* Menu Sections */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {menuSections.map((section) => (
                  <div key={section.title}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      {section.title}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={onClose}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-foreground hover:bg-accent transition-colors group"
                        >
                          <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Theme Toggle */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Aspetto
                  </p>
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-foreground hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isDark ? (
                        <Moon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Sun className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="font-medium">
                        {isDark ? "Tema Scuro" : "Tema Chiaro"}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "w-12 h-7 rounded-full p-1 transition-colors",
                        isDark ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow-sm"
                        animate={{ x: isDark ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </button>
                </div>
              </div>

              {/* Logout */}
              <div className="p-4 border-t border-border">
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-destructive bg-destructive/10 hover:bg-destructive/20 font-medium transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Esci</span>
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
