import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getAllBatches,
  addBatch,
  deleteBatch,
  getStudentsByBatch,
} from "../../firebase/firestore";
import { formatDate } from "../../utils/validation";
import ConfirmDialog from "../shared/ConfirmDialog";

const BATCH_REGEX = /^BDDN-\d{4}-\d{2,3}$/;

export default function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBatchId, setNewBatchId] = useState("");
  const [newBatchLabel, setNewBatchLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [batchError, setBatchError] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Expanded batch (show students)
  const [expanded, setExpanded] = useState(null);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllBatches();
      setBatches(data);
    } catch {
      toast.error("Failed to load batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    setBatchError("");
    const id = newBatchId.trim().toUpperCase();
    if (!id) {
      setBatchError("Batch ID is required.");
      return;
    }
    if (!BATCH_REGEX.test(id)) {
      setBatchError("Format must be: BDDN-YYYY-NN (e.g. BDDN-2026-01)");
      return;
    }
    if (batches.some((b) => b.batchId === id)) {
      setBatchError("This Batch ID already exists.");
      return;
    }

    setAdding(true);
    try {
      await addBatch(id, newBatchLabel.trim());
      toast.success(`✅ Batch ${id} created!`);
      setNewBatchId("");
      setNewBatchLabel("");
      load();
    } catch {
      toast.error("Failed to create batch.");
    } finally {
      setAdding(false);
    }
  };

  const handleExpand = async (batchId) => {
    if (expanded === batchId) {
      setExpanded(null);
      setBatchStudents([]);
      return;
    }
    setExpanded(batchId);
    setLoadingStudents(true);
    try {
      const students = await getStudentsByBatch(batchId);
      setBatchStudents(students);
    } catch {
      toast.error("Failed to load students for this batch.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBatch(deleteTarget.id);
      toast.success(`🗑️ Batch ${deleteTarget.batchId} deleted.`);
      setDeleteTarget(null);
      if (expanded === deleteTarget.batchId) setExpanded(null);
      load();
    } catch {
      toast.error("Failed to delete batch.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Batch Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Create and manage course batches for BDDN Institute
        </p>
      </div>

      {/* Add batch form */}
      <div className="card mb-6">
        <h2 className="text-base font-bold text-slate-700 mb-4">➕ Create New Batch</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 field-group">
            <label className="field-label" htmlFor="new-batch-id">
              Batch ID <span className="text-red-500">*</span>
            </label>
            <input
              id="new-batch-id"
              type="text"
              className={`field-input ${batchError ? "border-red-400" : ""}`}
              placeholder="e.g. BDDN-2026-01"
              value={newBatchId}
              onChange={(e) => {
                setNewBatchId(e.target.value.toUpperCase());
                setBatchError("");
              }}
            />
            {batchError && <p className="field-error">{batchError}</p>}
            <p className="text-xs text-slate-400 mt-1">Format: BDDN-YYYY-NN</p>
          </div>
          <div className="flex-1 field-group">
            <label className="field-label" htmlFor="new-batch-label">
              Label / Description (Optional)
            </label>
            <input
              id="new-batch-label"
              type="text"
              className="field-input"
              placeholder="e.g. Morning Batch, Python Batch 1"
              value={newBatchLabel}
              onChange={(e) => setNewBatchLabel(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              id="create-batch-btn"
              onClick={handleAdd}
              disabled={adding}
              className="btn-primary h-[42px] whitespace-nowrap"
            >
              {adding ? (
                <>
                  <div className="spinner" />
                  Creating...
                </>
              ) : (
                "Create Batch"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Batch list */}
      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <div className="spinner-dark" />
        </div>
      ) : batches.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl mb-3 block">📁</span>
          <p className="text-slate-600 font-semibold">No batches created yet.</p>
          <p className="text-slate-400 text-sm">Create your first batch above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div key={batch.id} className="table-container">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
                    📁
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm">{batch.batchId}</p>
                    {batch.label && (
                      <p className="text-xs text-slate-500">{batch.label}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      Created: {formatDate(batch.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    id={`expand-batch-${batch.batchId}`}
                    onClick={() => handleExpand(batch.batchId)}
                    className="btn-secondary text-xs"
                  >
                    {expanded === batch.batchId ? "▲ Hide Students" : "▼ View Students"}
                  </button>
                  <button
                    id={`delete-batch-${batch.batchId}`}
                    onClick={() => setDeleteTarget(batch)}
                    className="btn-ghost text-red-400 hover:bg-red-50 text-sm"
                    title="Delete batch"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Students in batch */}
              {expanded === batch.batchId && (
                <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                  {loadingStudents ? (
                    <div className="flex justify-center py-6">
                      <div className="spinner-dark" />
                    </div>
                  ) : batchStudents.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">
                      No students enrolled in this batch yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-slate-500 font-bold uppercase border-b border-slate-100">
                            <th className="pb-2 pr-4">Student ID</th>
                            <th className="pb-2 pr-4">Name</th>
                            <th className="pb-2 pr-4">Phone</th>
                            <th className="pb-2 pr-4">Course</th>
                            <th className="pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batchStudents.map((s) => (
                            <tr key={s.id} className="border-b border-slate-50">
                              <td className="py-2 pr-4 font-mono text-xs text-brand-700">{s.studentId}</td>
                              <td className="py-2 pr-4 font-medium text-slate-700">{s.name}</td>
                              <td className="py-2 pr-4 text-slate-500">{s.phone}</td>
                              <td className="py-2 pr-4 text-slate-500 max-w-[140px] truncate">{s.course}</td>
                              <td className="py-2">
                                <span className={
                                  s.paymentStatus === "Fully Paid" ? "badge-paid" :
                                  s.paymentStatus === "Partial" ? "badge-partial" :
                                  "badge-pending"
                                }>
                                  {s.paymentStatus || "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-xs text-slate-400 mt-2">
                        {batchStudents.length} student{batchStudents.length !== 1 ? "s" : ""} in this batch
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Batch?"
        message={`Delete batch "${deleteTarget?.batchId}"? Students in this batch will not be deleted, but their batch reference will remain.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
