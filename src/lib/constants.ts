// ============================================
// Housy - Constants
// ============================================

export const DAYS_OF_WEEK = [
  { value: 0, label: "Domenica", short: "Dom" },
  { value: 1, label: "Lunedì", short: "Lun" },
  { value: 2, label: "Martedì", short: "Mar" },
  { value: 3, label: "Mercoledì", short: "Mer" },
  { value: 4, label: "Giovedì", short: "Gio" },
  { value: 5, label: "Venerdì", short: "Ven" },
  { value: 6, label: "Sabato", short: "Sab" },
] as const;

export const FREQUENCIES = [
  { value: "daily", label: "Giornaliero", icon: "Calendar" },
  { value: "weekly", label: "Settimanale", icon: "CalendarDays" },
  { value: "monthly", label: "Mensile", icon: "CalendarRange" },
] as const;

export const WASTE_TYPES = [
  { value: "indifferenziato", label: "Indifferenziato", color: "#6b7280", icon: "Trash2" },
  { value: "plastica", label: "Plastica", color: "#fbbf24", icon: "Package" },
  { value: "carta", label: "Carta", color: "#3b82f6", icon: "FileText" },
  { value: "vetro", label: "Vetro", color: "#10b981", icon: "Wine" },
  { value: "organico", label: "Organico", color: "#84cc16", icon: "Leaf" },
  { value: "metalli", label: "Metalli", color: "#a855f7", icon: "Cylinder" },
  { value: "altro", label: "Altro", color: "#8b5cf6", icon: "Box" },
] as const;

export const BILL_CATEGORIES = [
  { value: "utilities", label: "Utenze", icon: "Zap", color: "#f59e0b" },
  { value: "internet", label: "Internet/Telefono", icon: "Wifi", color: "#3b82f6" },
  { value: "insurance", label: "Assicurazioni", icon: "Shield", color: "#10b981" },
  { value: "subscription", label: "Abbonamenti", icon: "CreditCard", color: "#8b5cf6" },
  { value: "rent", label: "Affitto", icon: "Home", color: "#ef4444" },
  { value: "condominium", label: "Condominio", icon: "Building", color: "#6366f1" },
  { value: "other", label: "Altro", icon: "FileText", color: "#6b7280" },
] as const;

export const CHORE_POINTS = [
  { value: 1, label: "1 punto", description: "Compito molto semplice" },
  { value: 2, label: "2 punti", description: "Compito semplice" },
  { value: 3, label: "3 punti", description: "Compito normale" },
  { value: 5, label: "5 punti", description: "Compito impegnativo" },
  { value: 8, label: "8 punti", description: "Compito complesso" },
  { value: 10, label: "10 punti", description: "Compito molto impegnativo" },
] as const;

// Helper types
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]["value"];
export type Frequency = (typeof FREQUENCIES)[number]["value"];
export type WasteType = (typeof WASTE_TYPES)[number]["value"];
export type BillCategory = (typeof BILL_CATEGORIES)[number]["value"];

// Helper functions
export function getDayLabel(day: number): string {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.label ?? "";
}

export function getDayShort(day: number): string {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.short ?? "";
}

export function getFrequencyLabel(frequency: string): string {
  return FREQUENCIES.find((f) => f.value === frequency)?.label ?? frequency;
}

export function getWasteType(type: string) {
  return WASTE_TYPES.find((w) => w.value === type);
}

export function getBillCategory(category: string) {
  return BILL_CATEGORIES.find((c) => c.value === category);
}

// Date helpers
export function getNextDueDate(frequency: Frequency, fromDate: Date = new Date()): Date {
  const next = new Date(fromDate);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("it-IT", options ?? { day: "numeric", month: "short" }).format(d);
}

export function formatTime(time: string): string {
  // Convert "HH:MM:SS" to "HH:MM"
  return time.slice(0, 5);
}

// Bill status helper
export function getBillStatus(bill: {
  due_day: number;
  reminder_days_before: number;
  last_paid_date: string | null;
}): "paid" | "upcoming" | "overdue" | "normal" {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Check if paid this month
  if (bill.last_paid_date) {
    const lastPaid = new Date(bill.last_paid_date);
    if (lastPaid.getMonth() === currentMonth && lastPaid.getFullYear() === currentYear) {
      return "paid";
    }
  }

  const dueDay = bill.due_day;
  const reminderDays = bill.reminder_days_before || 3;

  // Overdue: current day is past due day and not paid
  if (currentDay > dueDay) {
    return "overdue";
  }

  // Upcoming: within reminder window
  if (dueDay - currentDay <= reminderDays) {
    return "upcoming";
  }

  return "normal";
}
