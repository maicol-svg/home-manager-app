"use server";

import { createClient } from "@/lib/supabase/server";

type HouseholdMembership = {
  household_id: string;
};

type HouseholdBudget = {
  monthly_budget: number | null;
};

// Types
export type DashboardSummary = {
  expenses: {
    totalMonth: number;
    expenseCount: number;
    avgExpense: number;
    budget: number | null;
    byCategory: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    recent: Array<{
      id: string;
      description: string;
      amount: number;
      date: string;
      category: { name: string; color: string } | null;
    }>;
  };
  chores: {
    todayCount: number;
    overdueCount: number;
    myPoints: number;
    nextChore: {
      id: string;
      name: string;
      nextDue: string | null;
    } | null;
  };
  waste: {
    nextCollection: {
      type: string;
      day: string;
      dayNumber: number;
    } | null;
  };
  bills: {
    upcomingCount: number;
    overdueCount: number;
    nextBill: {
      id: string;
      name: string;
      dueDay: number;
      amount: number | null;
    } | null;
  };
};

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's household
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) return null;

  const householdId = membership.household_id;

  // Get household budget
  const { data: householdData } = await supabase
    .from("households")
    .select("monthly_budget")
    .eq("id", householdId)
    .single();

  const household = householdData as HouseholdBudget | null;
  const monthlyBudget = household?.monthly_budget || null;

  // Get current month date range
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfMonth = firstDayOfMonth.toISOString().split("T")[0];
  const endOfMonth = lastDayOfMonth.toISOString().split("T")[0];

  // ============ EXPENSES ============

  // Get expenses for current month
  const { data: expensesData } = await supabase
    .from("expenses")
    .select(
      `
      id,
      amount,
      description,
      date,
      category:expense_categories (
        name,
        color
      )
    `
    )
    .eq("household_id", householdId)
    .gte("date", startOfMonth)
    .lte("date", endOfMonth)
    .order("date", { ascending: false });

  type ExpenseRow = {
    id: string;
    amount: number;
    description: string | null;
    date: string;
    category: { name: string; color: string } | null;
  };
  const expenseList = (expensesData as ExpenseRow[] | null) || [];
  const totalMonth = expenseList.reduce((sum, e) => sum + Number(e.amount), 0);
  const expenseCount = expenseList.length;
  const avgExpense = expenseCount > 0 ? totalMonth / expenseCount : 0;

  // Group by category
  const categoryMap = new Map<string, { name: string; value: number; color: string }>();
  expenseList.forEach((e) => {
    const catName = (e.category as { name: string; color: string } | null)?.name || "Altro";
    const catColor = (e.category as { name: string; color: string } | null)?.color || "#6b7280";
    const existing = categoryMap.get(catName);
    if (existing) {
      existing.value += Number(e.amount);
    } else {
      categoryMap.set(catName, { name: catName, value: Number(e.amount), color: catColor });
    }
  });

  const byCategory = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);

  // Recent expenses (last 4)
  const recent = expenseList.slice(0, 4).map((e) => ({
    id: e.id,
    description: e.description || "",
    amount: Number(e.amount),
    date: e.date,
    category: e.category as { name: string; color: string } | null,
  }));

  // ============ CHORES ============

  // Get all chores
  const { data: choresData } = await supabase
    .from("chores")
    .select("id, name, next_due, current_assignee, is_active")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("next_due", { ascending: true });

  type ChoreRow = {
    id: string;
    name: string;
    next_due: string | null;
    current_assignee: string | null;
    is_active: boolean;
  };
  const choreList = (choresData as ChoreRow[] | null) || [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Count chores due today and overdue
  let todayCount = 0;
  let overdueCount = 0;
  let nextChoreForUser: {
    id: string;
    name: string;
    nextDue: string | null;
  } | null = null;

  choreList.forEach((c) => {
    if (c.next_due) {
      const dueDate = new Date(c.next_due);
      if (dueDate < todayStart) {
        overdueCount++;
      } else if (dueDate >= todayStart && dueDate <= todayEnd) {
        todayCount++;
      }
    }

    // Find next chore assigned to current user
    if (c.current_assignee === user.id && !nextChoreForUser) {
      nextChoreForUser = {
        id: c.id,
        name: c.name,
        nextDue: c.next_due,
      };
    }
  });

  // Get user's points this month
  const { data: completionsData } = await supabase
    .from("chore_completions")
    .select("points_earned")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .gte("completed_at", firstDayOfMonth.toISOString())
    .lte("completed_at", lastDayOfMonth.toISOString());

  type CompletionRow = { points_earned: number };
  const completions = (completionsData as CompletionRow[] | null) || [];
  const myPoints = completions.reduce((sum, c) => sum + c.points_earned, 0);

  // ============ WASTE ============

  const { data: wasteSchedulesData } = await supabase
    .from("waste_schedules")
    .select("waste_type, day_of_week")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });

  type WasteRow = { waste_type: string; day_of_week: number };
  const wasteSchedules = (wasteSchedulesData as WasteRow[] | null) || [];

  let nextWasteCollection: { type: string; day: string; dayNumber: number } | null = null;

  if (wasteSchedules.length > 0) {
    const today = now.getDay(); // 0 = Sunday
    const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

    // Find next collection
    let next = wasteSchedules.find((s) => s.day_of_week > today);
    if (!next) {
      next = wasteSchedules[0]; // Wrap to next week
    }

    nextWasteCollection = {
      type: next.waste_type,
      day: days[next.day_of_week],
      dayNumber: next.day_of_week,
    };
  }

  // ============ BILLS ============

  const { data: billsData } = await supabase
    .from("recurring_bills")
    .select("id, name, amount, due_day, reminder_days_before, last_paid_date")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("due_day", { ascending: true });

  type BillRow = {
    id: string;
    name: string;
    amount: number | null;
    due_day: number;
    reminder_days_before: number;
    last_paid_date: string | null;
  };
  const billList = (billsData as BillRow[] | null) || [];
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let upcomingBillsCount = 0;
  let overdueBillsCount = 0;
  let nextBill: {
    id: string;
    name: string;
    dueDay: number;
    amount: number | null;
  } | null = null;

  billList.forEach((b) => {
    // Check if paid this month
    const isPaid =
      b.last_paid_date &&
      new Date(b.last_paid_date).getMonth() === currentMonth &&
      new Date(b.last_paid_date).getFullYear() === currentYear;

    if (!isPaid) {
      if (currentDay > b.due_day) {
        overdueBillsCount++;
      } else if (b.due_day - currentDay <= (b.reminder_days_before || 3)) {
        upcomingBillsCount++;
        if (!nextBill) {
          nextBill = {
            id: b.id,
            name: b.name,
            dueDay: b.due_day,
            amount: b.amount,
          };
        }
      }
    }
  });

  // ============ RETURN SUMMARY ============

  return {
    expenses: {
      totalMonth,
      expenseCount,
      avgExpense,
      budget: monthlyBudget,
      byCategory,
      recent,
    },
    chores: {
      todayCount,
      overdueCount,
      myPoints,
      nextChore: nextChoreForUser,
    },
    waste: {
      nextCollection: nextWasteCollection,
    },
    bills: {
      upcomingCount: upcomingBillsCount,
      overdueCount: overdueBillsCount,
      nextBill,
    },
  };
}

// Quick stats for individual sections
export async function getExpenseStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) return null;

  // Current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: expensesData } = await supabase
    .from("expenses")
    .select("amount")
    .eq("household_id", membership.household_id)
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  type ExpenseAmountRow = { amount: number };
  const expenses = (expensesData as ExpenseAmountRow[] | null) || [];
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const count = expenses.length;

  return {
    total,
    count,
    avg: count > 0 ? total / count : 0,
  };
}
