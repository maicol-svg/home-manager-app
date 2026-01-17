"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Clock, CheckCircle2, Calendar } from "lucide-react";
import BillCard from "./BillCard";
import BillForm from "./BillForm";
import { type Bill } from "@/app/actions/bills";
import { getBillStatus } from "@/lib/constants";

interface BillListProps {
  bills: Bill[];
  isAdmin: boolean;
}

export default function BillList({ bills, isAdmin }: BillListProps) {
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Group bills by status
  const activeBills = bills.filter((b) => b.is_active);

  const overdueBills = activeBills.filter((b) => getBillStatus(b) === "overdue");
  const upcomingBills = activeBills.filter((b) => getBillStatus(b) === "upcoming");
  const paidBills = activeBills.filter((b) => getBillStatus(b) === "paid");
  const normalBills = activeBills.filter((b) => getBillStatus(b) === "normal");

  // Sort by due day
  const sortByDueDay = (a: Bill, b: Bill) => a.due_day - b.due_day;

  const sections = [
    {
      key: "overdue",
      title: "Scadute",
      bills: overdueBills.sort(sortByDueDay),
      icon: AlertTriangle,
      iconColor: "text-red-500",
      emptyText: null,
    },
    {
      key: "upcoming",
      title: "In scadenza",
      bills: upcomingBills.sort(sortByDueDay),
      icon: Clock,
      iconColor: "text-amber-500",
      emptyText: null,
    },
    {
      key: "normal",
      title: "Prossime",
      bills: normalBills.sort(sortByDueDay),
      icon: Calendar,
      iconColor: "text-gray-500",
      emptyText: null,
    },
    {
      key: "paid",
      title: "Pagate questo mese",
      bills: paidBills.sort(sortByDueDay),
      icon: CheckCircle2,
      iconColor: "text-green-500",
      emptyText: null,
    },
  ];

  // Filter out empty sections
  const visibleSections = sections.filter((s) => s.bills.length > 0);

  if (activeBills.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna scadenza</h3>
        <p className="text-gray-500">
          Non ci sono bollette o scadenze attive.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {visibleSections.map((section) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-5 h-5 ${section.iconColor}`} />
                <h2 className="font-semibold text-gray-900">{section.title}</h2>
                <span className="text-sm text-gray-500">({section.bills.length})</span>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {section.bills.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      isAdmin={isAdmin}
                      onEdit={setEditingBill}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit modal */}
      <BillForm
        isOpen={!!editingBill}
        onClose={() => setEditingBill(null)}
        bill={editingBill}
      />
    </>
  );
}
