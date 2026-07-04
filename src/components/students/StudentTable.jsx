import React, { useState, useMemo } from "react";
import { formatDate, formatCurrency, formatAadhaarDisplay } from "../../utils/validation";
import PaymentStatusBadge from "../shared/PaymentStatusBadge";
import { exportStudentPDF } from "../../utils/pdfExport";

const SORT_ICONS = { asc: "↑", desc: "↓", none: "⇅" };

export default function StudentTable({ students, onEdit, onDelete, onView, selectedIds = [], onSelectionChange }) {
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    return [...students].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle Firestore timestamps
      if (aVal?.toDate) aVal = aVal.toDate().getTime();
      if (bVal?.toDate) bVal = bVal.toDate().getTime();

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDir]);

  const th = (label, field) => (
    <th
      className="table-th"
      onClick={() => handleSort(field)}
      title={`Sort by ${label}`}
    >
      {label}{" "}
      <span className="text-slate-300">
        {sortField === field ? SORT_ICONS[sortDir] : SORT_ICONS.none}
      </span>
    </th>
  );

  if (students.length === 0) {
    return (
      <div className="table-container">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <span className="text-5xl mb-4">🎓</span>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No students found</h3>
          <p className="text-slate-400 text-sm">
            Add a new student or adjust your search/filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-th w-10 text-center">
                <input
                  type="checkbox"
                  className="cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={students.length > 0 && selectedIds.length === students.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectionChange(students.map((s) => s.id));
                    } else {
                      onSelectionChange([]);
                    }
                  }}
                />
              </th>
              {th("Student ID", "studentId")}
              {th("Name", "name")}
              {th("Phone", "phone")}
              <th className="table-th">Alt. Phone</th>
              <th className="table-th">Email</th>
              <th className="table-th">Aadhaar</th>
              {th("Course", "course")}
              {th("Batch", "batchId")}
              {th("Mode", "classMode")}
              {th("Joined", "dateOfJoining")}
              {th("Fee", "totalFee")}
              {th("Status", "paymentStatus")}
              <th className="table-th text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((student) => (
              <React.Fragment key={student.id}>
                <tr className={`table-tr ${expandedStudentId === student.id ? "bg-slate-50" : ""}`}>
                  <td className="table-td w-10 text-center">
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      checked={selectedIds.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectionChange([...selectedIds, student.id]);
                        } else {
                          onSelectionChange(selectedIds.filter((id) => id !== student.id));
                        }
                      }}
                    />
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                      {student.studentId}
                    </span>
                  </td>
                  <td className="table-td font-semibold text-slate-800">
                    {student.name}
                  </td>
                  <td className="table-td">{student.phone}</td>
                  <td className="table-td text-slate-500">
                    {student.alternatePhone || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="table-td">
                    {student.email ? (
                      <a
                        href={`mailto:${student.email}`}
                        className="text-brand-600 hover:underline text-xs"
                        title={student.email}
                      >
                        {student.email}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="table-td text-xs text-slate-500 font-mono">
                    {formatAadhaarDisplay(student.aadhaar)}
                  </td>
                  <td className="table-td max-w-[160px] truncate" title={student.course}>
                    {student.course}
                  </td>
                  <td className="table-td">
                    <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-md">
                      {student.batchId || "—"}
                    </span>
                  </td>
                  <td className="table-td">{student.classMode || "—"}</td>
                  <td className="table-td text-xs">
                    {formatDate(student.dateOfJoining)}
                  </td>
                  <td className="table-td font-medium">
                    {formatCurrency(student.totalFee)}
                  </td>
                  <td className="table-td">
                    <PaymentStatusBadge status={student.paymentStatus} />
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                        className="btn-ghost text-slate-600 hover:bg-slate-100 text-xs px-2 py-1"
                        title="Toggle details"
                      >
                        {expandedStudentId === student.id ? "👁️ Hide" : "👁️ View"}
                      </button>
                      <button
                        id={`view-btn-${student.studentId}`}
                        onClick={() => onEdit(student)}
                        className="btn-ghost text-brand-600 hover:bg-brand-50 text-xs px-2 py-1"
                        title="View/Edit student"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        id={`pdf-btn-${student.studentId}`}
                        onClick={() => exportStudentPDF(student)}
                        className="btn-ghost text-slate-600 text-xs px-2 py-1"
                        title="Download PDF receipt"
                      >
                        📄 PDF
                      </button>
                      <button
                        id={`delete-btn-${student.studentId}`}
                        onClick={() => onDelete(student)}
                        className="btn-ghost text-red-500 hover:bg-red-50 text-xs px-2 py-1"
                        title="Delete student"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedStudentId === student.id && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={14} className="px-6 py-4 border-b border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        {/* Section 1: Admission & Personal Info */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                            📝 Admission & Personal Details
                          </h4>
                          <div className="space-y-2 text-xs">
                            <p className="text-slate-500"><strong className="text-slate-700 min-w-[120px] inline-block">Admission No:</strong> {student.admissionNo || <span className="text-slate-300">N/A</span>}</p>
                            <p className="text-slate-500"><strong className="text-slate-700 min-w-[120px] inline-block">Enrollment No:</strong> {student.enrollmentNo || <span className="text-slate-300">N/A</span>}</p>
                            <p className="text-slate-500"><strong className="text-slate-700 min-w-[120px] inline-block">Date of Birth:</strong> {student.dob ? formatDate(student.dob) : <span className="text-slate-300">N/A</span>}</p>
                            <p className="text-slate-500"><strong className="text-slate-700 min-w-[120px] inline-block">Gender:</strong> {student.gender || <span className="text-slate-300">N/A</span>}</p>
                            <p className="text-slate-500"><strong className="text-slate-700 min-w-[120px] inline-block">Qualification:</strong> {student.highestQualification || <span className="text-slate-300">N/A</span>}</p>
                          </div>
                        </div>

                        {/* Section 2: Parent & Guardian Details */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                            👨‍👩‍👦 Parent / Guardian Details
                          </h4>
                          <div className="space-y-2 text-xs">
                            <p className="text-slate-500"><strong className="text-slate-700 min-w-[120px] inline-block">Father's Name:</strong> {student.fatherName || <span className="text-slate-300">N/A</span>}</p>
                            <p className="text-slate-500"><strong className="text-slate-700 min-w-[120px] inline-block">Mother's Name:</strong> {student.motherName || <span className="text-slate-300">N/A</span>}</p>
                            <p className="text-slate-500"><strong className="text-slate-700 min-w-[120px] inline-block">Guardian Contact:</strong> {student.guardianPhone || <span className="text-slate-300">N/A</span>}</p>
                            <p className="text-slate-500"><strong className="text-slate-700 min-w-[120px] inline-block">Relationship:</strong> {student.guardianRelationship || <span className="text-slate-300">N/A</span>}</p>
                          </div>
                        </div>

                        {/* Section 3: Documents & Address */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                            📁 Documents & Address
                          </h4>
                          <div className="space-y-3 text-xs">
                            <p className="text-slate-500"><strong className="text-slate-700 block mb-1">Permanent Address:</strong> <span className="text-slate-600 block pl-1 border-l-2 border-slate-200">{student.address || <span className="text-slate-300">N/A</span>}</span></p>
                            <div className="flex gap-4 mt-2">
                              {student.photoUrl && (
                                <a href={student.photoUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center gap-1">
                                  🖼️ Photo
                                </a>
                              )}
                              {student.aadhaarImageUrl && (
                                <a href={student.aadhaarImageUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center gap-1">
                                  📎 Aadhaar
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="px-4 py-3 border-t border-slate-50 bg-slate-50 rounded-b-2xl flex justify-between items-center">
        <p className="text-xs text-slate-400">
          Showing <span className="font-semibold text-slate-600">{students.length}</span> student{students.length !== 1 ? "s" : ""}
        </p>
        {selectedIds.length > 0 && (
          <p className="text-xs text-brand-600 font-semibold">
            {selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>
    </div>
  );
}
