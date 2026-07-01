import React from "react";

const STATUS_CONFIG = {
  "Fully Paid": { cls: "badge-paid", icon: "✅" },
  Partial: { cls: "badge-partial", icon: "🕒" },
  Pending: { cls: "badge-pending", icon: "❗" },
};

export default function PaymentStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG["Pending"];
  return (
    <span className={config.cls}>
      {config.icon} {status || "Pending"}
    </span>
  );
}
