import React, { useEffect, useState } from "react";
import { getAllStudents } from "../../firebase/firestore";
import { formatCurrency } from "../../utils/validation";

export default function SummaryCards() {
  const [stats, setStats] = useState({
    total: 0,
    totalFees: 0,
    pending: 0,
    partial: 0,
    fullyPaid: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const students = await getAllStudents();
        let totalFees = 0;
        let pending = 0;
        let partial = 0;
        let fullyPaid = 0;

        students.forEach((s) => {
          const fee = Number(s.totalFee) || 0;
          const paid =
            s.paymentType === "Full Payment" && s.fullPaymentDate
              ? fee
              : s.installments?.reduce(
                  (sum, i) => sum + (Number(i.amount) || 0),
                  0
                ) || 0;
          totalFees += paid;
          if (s.paymentStatus === "Pending") pending++;
          else if (s.paymentStatus === "Partial") partial++;
          else if (s.paymentStatus === "Fully Paid") fullyPaid++;
        });

        setStats({
          total: students.length,
          totalFees,
          pending,
          partial,
          fullyPaid,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    {
      id: "stat-total",
      icon: "🎓",
      label: "Total Students",
      value: loading ? "—" : stats.total,
      iconBg: "bg-brand-100",
      valueColor: "text-brand-700",
    },
    {
      id: "stat-fees",
      icon: "💰",
      label: "Total Fees Collected",
      value: loading ? "—" : formatCurrency(stats.totalFees),
      iconBg: "bg-emerald-100",
      valueColor: "text-emerald-700",
    },
    {
      id: "stat-pending",
      icon: "❗",
      label: "Pending Payments",
      value: loading ? "—" : stats.pending,
      iconBg: "bg-red-100",
      valueColor: "text-red-600",
    },
    {
      id: "stat-partial",
      icon: "🕒",
      label: "Partial Payments",
      value: loading ? "—" : stats.partial,
      iconBg: "bg-amber-100",
      valueColor: "text-amber-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.id} id={card.id} className="summary-card">
          <div className={`summary-icon ${card.iconBg}`}>
            {card.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">{card.label}</p>
            <p className={`text-xl font-bold ${card.valueColor} truncate`}>
              {loading ? (
                <span className="inline-block w-12 h-5 bg-slate-100 rounded animate-pulse" />
              ) : (
                card.value
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
