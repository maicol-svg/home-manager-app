"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Zap,
  Wifi,
  Shield,
  CreditCard,
  Home,
  Building,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { deleteBill, markBillPaid, type Bill } from "@/app/actions/bills";
import { ConfirmModal } from "@/components/ui/modal";
import { BILL_CATEGORIES, formatCurrency, getBillStatus } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Wifi,
  Shield,
  CreditCard,
  Home,
  Building,
  FileText,
};

interface BillCardProps {
  bill: Bill;
  isAdmin: boolean;
  onEdit: (bill: Bill) => void;
}

const statusConfig = {
  paid: {
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle2,
    iconColor: "text-green-500",
    label: "Pagata",
    labelColor: "text-green-600 bg-green-100",
  },
  overdue: {
    bg: "bg-red-50 border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-500",
    label: "Scaduta",
    labelColor: "text-red-600 bg-red-100",
  },
  upcoming: {
    bg: "bg-amber-50 border-amber-200",
    icon: Clock,
    iconColor: "text-amber-500",
    label: "In scadenza",
    labelColor: "text-amber-600 bg-amber-100",
  },
  normal: {
    bg: "bg-white border-gray-200",
    icon: Clock,
    iconColor: "text-gray-400",
    label: "",
    labelColor: "",
  },
};

export default function BillCard({ bill, isAdmin, onEdit }: BillCardProps) {
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  const status = getBillStatus(bill);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const category = BILL_CATEGORIES.find((c) => c.value === bill.category);
  const Icon = iconMap[category?.icon || "FileText"] || FileText;
  const categoryColor = category?.color || "#6b7280";

  const handleMarkPaid = async () => {
    setIsMarkingPaid(true);
    const result = await markBillPaid(bill.id);
    if (!result.success) {
      alert(result.error || "Errore");
    }
    router.refresh();
    setIsMarkingPaid(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteBill(bill.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Errore");
    }
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  const getDueDateText = () => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysUntil = bill.due_day - currentDay;

    if (status === "paid") {
      return "Pagata questo mese";
    }
    if (daysUntil === 0) {
      return "Scade oggi";
    }
    if (daysUntil === 1) {
      return "Scade domani";
    }
    if (daysUntil > 0) {
      return `Scade tra ${daysUntil} giorni`;
    }
    return `Scaduta da ${Math.abs(daysUntil)} giorni`;
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`rounded-xl border p-4 transition-all ${config.bg} ${
          !bill.is_active ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Category icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            <Icon className="w-6 h-6" style={{ color: categoryColor }} />
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{bill.name}</h3>
              {config.label && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.labelColor}`}
                >
                  {config.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm">
              <span className="text-gray-600">Giorno {bill.due_day}</span>
              {category && (
                <span className="text-gray-400">{category.label}</span>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">{getDueDateText()}</p>
          </div>

          {/* Amount and actions */}
          <div className="flex flex-col items-end gap-2">
            {bill.amount && (
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(bill.amount)}
              </p>
            )}

            <div className="flex items-center gap-1">
              {status !== "paid" && (
                <button
                  onClick={handleMarkPaid}
                  disabled={isMarkingPaid}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isMarkingPaid ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Pagata
                </button>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={() => onEdit(bill)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Modifica"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Elimina scadenza"
        description={`Sei sicuro di voler eliminare "${bill.name}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
