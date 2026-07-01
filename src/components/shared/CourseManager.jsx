import React, { useState } from "react";
import { saveCourseSettings } from "../../firebase/firestore";
import toast from "react-hot-toast";

export default function CourseManager({ courses, durations, onClose, onSaved }) {
  const [courseList, setCourseList] = useState([...courses]);
  const [durationList, setDurationList] = useState([...durations]);
  const [newCourse, setNewCourse] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Courses ──────────────────────────────────────────────────────────────────
  const addCourse = () => {
    const trimmed = newCourse.trim();
    if (!trimmed) return;
    if (courseList.includes(trimmed)) {
      toast.error("Course already exists!");
      return;
    }
    setCourseList((prev) => [...prev, trimmed]);
    setNewCourse("");
  };

  const removeCourse = (idx) => {
    setCourseList((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Durations ────────────────────────────────────────────────────────────────
  const addDuration = () => {
    const trimmed = newDuration.trim();
    if (!trimmed) return;
    if (durationList.includes(trimmed)) {
      toast.error("Duration already exists!");
      return;
    }
    setDurationList((prev) => [...prev, trimmed]);
    setNewDuration("");
  };

  const removeDuration = (idx) => {
    setDurationList((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (courseList.length === 0) {
      toast.error("Add at least one course.");
      return;
    }
    if (durationList.length === 0) {
      toast.error("Add at least one duration.");
      return;
    }
    setSaving(true);
    try {
      await saveCourseSettings(courseList, durationList);
      toast.success("✅ Course settings saved!");
      onSaved(courseList, durationList);
      onClose();
    } catch (err) {
      toast.error("Failed to save settings.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box w-full max-w-lg">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              📚 Manage Courses & Durations
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add or remove available courses and durations for the student form
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost text-slate-400 hover:text-slate-600 text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-6">
          {/* ── Courses section ── */}
          <div>
            <p className="form-section-title">🎓 Courses</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="field-input flex-1"
                placeholder="e.g. Cyber Security"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCourse()}
              />
              <button
                onClick={addCourse}
                className="btn-primary px-4 py-2 text-sm shrink-0"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {courseList.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-3">
                  No courses added yet
                </p>
              )}
              {courseList.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 group"
                >
                  <span className="text-sm text-slate-700 truncate">{c}</span>
                  <button
                    onClick={() => removeCourse(idx)}
                    className="text-slate-300 hover:text-red-500 transition-colors text-base shrink-0 opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Durations section ── */}
          <div>
            <p className="form-section-title">⏱️ Durations</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="field-input flex-1"
                placeholder="e.g. 4 Months"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDuration()}
              />
              <button
                onClick={addDuration}
                className="btn-primary px-4 py-2 text-sm shrink-0"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {durationList.length === 0 && (
                <p className="text-xs text-slate-400 italic">No durations added yet</p>
              )}
              {durationList.map((d, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 text-sm rounded-full border border-brand-100 group"
                >
                  {d}
                  <button
                    onClick={() => removeDuration(idx)}
                    className="text-brand-300 hover:text-red-500 transition-colors text-xs opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? (
              <>
                <div className="spinner" />
                Saving...
              </>
            ) : (
              "💾 Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
