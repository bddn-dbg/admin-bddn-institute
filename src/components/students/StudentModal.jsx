import React from "react";
import StudentForm from "./StudentForm";

export default function StudentModal({ student, batches, courses = [], durations = [], onSave, onClose, title }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {title || (student ? "Edit Student" : "Add New Student")}
            </h2>
            {student && (
              <p className="text-xs text-slate-400 mt-0.5">
                ID: {student.studentId}
              </p>
            )}
          </div>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="btn-icon text-lg text-slate-400 hover:text-slate-600"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body overflow-y-auto max-h-[75vh]">
          <StudentForm
            student={student}
            batches={batches}
            courses={courses}
            durations={durations}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
