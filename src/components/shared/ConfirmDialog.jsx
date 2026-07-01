import React from "react";

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, danger = true }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-100" : "bg-amber-100"}`}>
          <span className="text-2xl">{danger ? "⚠️" : "❓"}</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
          {title || "Are you sure?"}
        </h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          {message || "This action cannot be undone."}
        </p>
        <div className="flex gap-3">
          <button
            id="confirm-cancel-btn"
            onClick={onCancel}
            className="btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            id="confirm-action-btn"
            onClick={onConfirm}
            className={`flex-1 justify-center ${danger ? "btn-danger" : "btn-primary"}`}
          >
            {danger ? "Yes, Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
