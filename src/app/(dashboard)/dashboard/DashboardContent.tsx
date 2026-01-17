"use client";

import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Plus,
  TrendingUp,
  Receipt,
  Calculator,
  ArrowRight,
  Trash2,
  FileText,
  Users,
  Star,
  Clock,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HeroDonutChart } from "@/components/dashboard/HeroDonutChart";
import { type DashboardSummary } from "@/app/actions/dashboard";
import { cn } from "@/lib/utils";

// Format currency
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

interface DashboardContentProps {
  summary: DashboardSummary | null;
  userName: string;
}

// Simple stat card without motion
function SimpleStatCard({
  title,
  value,
  icon,
  color = "primary",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "success" | "warning";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <Card variant="soft">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("p-2 rounded-xl", colorClasses[color])}>
            {icon}
          </div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
        </div>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardContent({ summary, userName }: DashboardContentProps) {
  // Handle no data
  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Impossibile caricare i dati della dashboard</p>
      </div>
    );
  }

  const { expenses, chores, waste, bills } = summary;
  const hasBudget = expenses.budget !== null && expenses.budget > 0;
  const budgetPercentage = hasBudget ? (expenses.totalMonth / expenses.budget!) * 100 : 0;

  // Build quick actions from real data
  const quickActions = [
    {
      name: "Rifiuti",
      description: waste.nextCollection ? `Prossima: ${waste.nextCollection.type}` : "Configura calendario",
      icon: Trash2,
      color: "from-emerald-400 to-emerald-600",
      href: "/rifiuti",
      value: waste.nextCollection ? waste.nextCollection.day : "-",
    },
    {
      name: "Bollette",
      description: bills.overdueCount > 0 ? `${bills.overdueCount} scadute` : "In scadenza",
      icon: bills.overdueCount > 0 ? AlertTriangle : FileText,
      color: bills.overdueCount > 0 ? "from-red-400 to-red-600" : "from-orange-400 to-orange-600",
      href: "/bollette",
      value: bills.upcomingCount + bills.overdueCount,
    },
    {
      name: "Turni",
      description: chores.overdueCount > 0 ? `${chores.overdueCount} in ritardo` : "Da fare oggi",
      icon: Users,
      color: chores.overdueCount > 0 ? "from-amber-400 to-amber-600" : "from-violet-400 to-violet-600",
      href: "/turni",
      value: chores.todayCount + chores.overdueCount,
    },
    {
      name: "Punti",
      description: "Questo mese",
      icon: Star,
      color: "from-yellow-400 to-yellow-600",
      href: "/turni",
      value: chores.myPoints,
    },
  ];

  const hasRecentExpenses = expenses.recent.length > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section - Greeting + Donut Chart */}
      <section className="text-center">
        {/* Greeting */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Ciao, {userName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Ecco come stai spendendo questo mese
          </p>
        </div>

        {/* Hero Donut Chart */}
        <HeroDonutChart
          data={expenses.byCategory}
          total={expenses.totalMonth}
          subtitle="Totale Mese"
        />

        {/* Quick action button */}
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/spese/nuova">
              <Plus className="mr-2 h-5 w-5" />
              Aggiungi spesa
            </Link>
          </Button>
        </div>
      </section>

      {/* Compact Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SimpleStatCard
          title="Spese"
          value={expenses.expenseCount}
          icon={<Receipt className="w-5 h-5" />}
          color="primary"
        />
        <SimpleStatCard
          title="Media"
          value={formatCurrency(expenses.avgExpense)}
          icon={<Calculator className="w-5 h-5" />}
          color="success"
        />
        <SimpleStatCard
          title="Trend"
          value={expenses.expenseCount > 0 ? `+${expenses.expenseCount}` : "0"}
          icon={<TrendingUp className="w-5 h-5" />}
          color="warning"
        />
        {hasBudget ? (
          <Card variant="soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Wallet className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Budget</p>
              </div>
              <Progress
                value={expenses.totalMonth}
                max={expenses.budget!}
                color={budgetPercentage > 90 ? "#ef4444" : "#0ea5e9"}
                size="sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(budgetPercentage)}% usato
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card variant="soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                  <Wallet className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Budget</p>
              </div>
              <Link
                href="/impostazioni"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Configura
                <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.name} href={action.href}>
            <Card variant="soft" className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`p-2.5 rounded-2xl bg-gradient-to-br ${action.color} shadow-sm`}
                  >
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {action.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">
                    {action.value}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Expenses */}
      <Card variant="soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Spese Recenti</CardTitle>
          <Link
            href="/spese"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Vedi tutte
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {hasRecentExpenses ? (
            <div className="space-y-2">
              {expenses.recent.slice(0, 5).map((expense) => (
                <Link key={expense.id} href={`/spese/${expense.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-accent/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${expense.category?.color || "#6b7280"}20`,
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: expense.category?.color || "#6b7280",
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {expense.description || "Spesa"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(expense.date), "d MMM", { locale: it })}
                          {expense.category && ` • ${expense.category.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nessuna spesa recente</p>
              <Link
                href="/spese/nuova"
                className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:underline"
              >
                <Plus className="w-4 h-4" />
                Aggiungi la prima spesa
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminders Section */}
      {(chores.nextChore || bills.nextBill) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chores.nextChore && (
            <Card variant="soft" className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-violet-200/50 dark:border-violet-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-violet-100 dark:bg-violet-900/50 rounded-2xl">
                    <Clock className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Prossimo turno</p>
                    <p className="font-semibold text-foreground truncate">{chores.nextChore.name}</p>
                    {chores.nextChore.nextDue && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(chores.nextChore.nextDue), "d MMMM", { locale: it })}
                      </p>
                    )}
                  </div>
                  <Link
                    href="/turni"
                    className="p-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {bills.nextBill && (
            <Card variant="soft" className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50 dark:border-orange-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-2xl">
                    <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Prossima scadenza</p>
                    <p className="font-semibold text-foreground truncate">{bills.nextBill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Giorno {bills.nextBill.dueDay}
                      {bills.nextBill.amount && ` • ${formatCurrency(bills.nextBill.amount)}`}
                    </p>
                  </div>
                  <Link
                    href="/bollette"
                    className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
