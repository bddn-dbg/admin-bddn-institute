import React from "react";
import { formatCurrency, calculateBalanceRemaining } from "../../utils/validation";

const PAY_MODES = ["Cash", "UPI", "Bank Transfer", "Card", "Cheque"];

export default function InstallmentTable({ installments = [], totalFee, onChange }) {
  const addRow = () => {
    const prevBalance = calculateBalanceRemaining(totalFee, installments);
    onChange([
      ...installments,
      {
        no: installments.length + 1,
        amount: "",
        date: "",
        paymentMode: "Cash",
        balance: prevBalance,
      },
    ]);
  };

  const updateRow = (index, field, value) => {
    const updated = installments.map((inst, i) => {
      if (i !== index) return inst;
      return { ...inst, [field]: value };
    });

    // Recalculate balances for all rows after update
    let running = Number(totalFee) || 0;
    const recalculated = updated.map((inst) => {
      running -= Number(inst.amount) || 0;
      return { ...inst, balance: Math.max(0, running) };
    });

    onChange(recalculated);
  };

  const removeRow = (index) => {
    const filtered = installments.filter((_, i) => i !== index);
    // Renumber and recalculate
    let running = Number(totalFee) || 0;
    const recalculated = filtered.map((inst, i) => {
      running -= Number(inst.amount) || 0;
      return { ...inst, no: i + 1, balance: Math.max(0, running) };
    });
    onChange(recalculated);
  };

  const totalPaid = installments.reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0
  );
  const balance = Math.max(0, (Number(totalFee) || 0) - totalPaid);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase w-10">#</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase">Amount (₹)</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase">Date</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase">Mode</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase">Balance</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {installments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-slate-400 text-xs">
                  No installments added yet. Click "+ Add Installment" below.
                </td>
              </tr>
            )}
            {installments.map((inst, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500 font-medium">{index + 1}</td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="field-input py-1.5 text-xs"
                    placeholder="0"
                    value={inst.amount}
                    onChange={(e) => updateRow(index, "amount", e.target.value)}
                    min={0}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="date"
                    className="field-input py-1.5 text-xs"
                    value={inst.date}
                    onChange={(e) => updateRow(index, "date", e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    className="field-select py-1.5 text-xs"
                    value={inst.paymentMode}
                    onChange={(e) => updateRow(index, "paymentMode", e.target.value)}
                  >
                    {PAY_MODES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 font-semibold text-xs text-slate-700">
                  {formatCurrency(inst.balance)}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none"
                    title="Remove installment"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {installments.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={2} className="px-3 py-2 text-xs font-bold text-slate-600">
                  Total Paid: <span className="text-emerald-600">{formatCurrency(totalPaid)}</span>
                </td>
                <td colSpan={3} className="px-3 py-2 text-xs font-bold text-slate-600">
                  Remaining Balance: <span className={balance > 0 ? "text-red-500" : "text-emerald-600"}>{formatCurrency(balance)}</span>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        id="add-installment-btn"
        className="mt-3 btn-secondary text-xs"
      >
        ➕ Add Installment
      </button>
    </div>
  );
}
