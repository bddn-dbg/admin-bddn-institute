import React from "react";

const MODES = ["All Modes", "Online", "Offline", "Hybrid"];
const STATUSES = ["All Statuses", "Pending", "Partial", "Fully Paid"];

export default function SearchFilterBar({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  batches = [],
  courses = [],
}) {
  return (
    <div className="card mb-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            id="search-input"
            type="text"
            className="field-input pl-9"
            placeholder="Search by Name, Phone, Student ID or Batch..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Dynamic course filter */}
          <select
            id="filter-course"
            value={filters.course}
            onChange={(e) => onFilterChange("course", e.target.value)}
            className="field-select min-w-[160px] text-xs"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="Other">Other</option>
          </select>

          <select
            id="filter-batch"
            value={filters.batch}
            onChange={(e) => onFilterChange("batch", e.target.value)}
            className="field-select min-w-[140px] text-xs"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.batchId}>{b.batchId}</option>
            ))}
          </select>

          <select
            id="filter-mode"
            value={filters.mode}
            onChange={(e) => onFilterChange("mode", e.target.value)}
            className="field-select min-w-[130px] text-xs"
          >
            {MODES.map((m) => (
              <option key={m} value={m === "All Modes" ? "" : m}>{m}</option>
            ))}
          </select>

          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="field-select min-w-[140px] text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s === "All Statuses" ? "" : s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
