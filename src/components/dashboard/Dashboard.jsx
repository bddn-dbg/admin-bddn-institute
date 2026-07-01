import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  getAllStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  getAllBatches,
  getCourseSettings,
} from "../../firebase/firestore";
import { calculatePaymentStatus } from "../../utils/validation";
import { exportStudentsExcel, exportStudentsCSV } from "../../utils/excelExport";
import SummaryCards from "./SummaryCards";
import SearchFilterBar from "./SearchFilterBar";
import StudentTable from "../students/StudentTable";
import StudentModal from "../students/StudentModal";
import ConfirmDialog from "../shared/ConfirmDialog";
import CourseManager from "../shared/CourseManager";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Dynamic course/duration settings
  const [courses, setCourses] = useState([]);
  const [durations, setDurations] = useState([]);
  const [courseManagerOpen, setCourseManagerOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    course: "",
    batch: "",
    mode: "",
    status: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, b, settings] = await Promise.all([
        getAllStudents(),
        getAllBatches(),
        getCourseSettings(),
      ]);
      setStudents(s);
      setBatches(b);
      setCourses(settings.courses || []);
      setDurations(settings.durations || []);
      setSelectedIds([]);
    } catch (err) {
      toast.error("Failed to load data. Check Firebase connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Filter + Search ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return students.filter((s) => {
      if (q) {
        const match =
          s.name?.toLowerCase().includes(q) ||
          s.phone?.includes(q) ||
          s.studentId?.toLowerCase().includes(q) ||
          s.batchId?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.course && s.course !== filters.course) return false;
      if (filters.batch && s.batchId !== filters.batch) return false;
      if (filters.mode && s.classMode !== filters.mode) return false;
      if (filters.status && s.paymentStatus !== filters.status) return false;
      return true;
    });
  }, [students, search, filters]);

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
  };

  // ── Add / Edit student ───────────────────────────────────────────────────────
  const openAdd = () => {
    setEditStudent(null);
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditStudent(student);
    setModalOpen(true);
  };

  const handleSave = async (payload, sid) => {
    try {
      if (editStudent) {
        await updateStudent(editStudent.id, payload);
        toast.success(`✅ ${payload.name} updated successfully!`);
      } else {
        await addStudent(payload);
        toast.success(`✅ ${payload.name} added successfully! ID: ${sid}`);
      }
      setModalOpen(false);
      setEditStudent(null);
      loadData();
    } catch (err) {
      toast.error("Save failed. Please try again.");
      console.error(err);
      throw err;
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeleteClick = (student) => {
    setDeleteTarget(student);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStudent(deleteTarget.id);
      toast.success(`🗑️ ${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.error("No students to export.");
      return;
    }
    exportStudentsExcel(students);
    toast.success("📊 Excel file downloaded!");
  };

  const handleExportCSV = () => {
    if (selectedIds.length === 0) {
      toast.error("Please check the boxes on the left of the students you want to export.");
      return;
    }
    const selectedStudents = students.filter((s) => selectedIds.includes(s.id));
    exportStudentsCSV(selectedStudents);
    toast.success(`📄 Exported ${selectedIds.length} student(s) to CSV!`);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage student admissions for BDDN Institute
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Manage Courses button */}
          <button
            id="manage-courses-btn"
            onClick={() => setCourseManagerOpen(true)}
            className="btn-secondary text-sm"
            title="Add or remove courses & durations"
          >
            📚 Manage Courses
          </button>
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="btn-secondary border-brand-200 text-brand-700 hover:bg-brand-50"
          >
            📄 Export Selected to CSV {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </button>
          <button
            id="export-excel-btn"
            onClick={handleExportExcel}
            className="btn-secondary"
          >
            📊 Export Excel
          </button>
          <button
            id="add-student-btn"
            onClick={openAdd}
            className="btn-primary text-base px-6 py-3"
          >
            ➕ Add New Student
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards key={students.length} />

      {/* Search + Filter */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
        batches={batches}
        courses={courses}
      />

      {/* Student Table */}
      {loading ? (
        <div className="table-container flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner-dark" />
            <p className="text-sm text-slate-400">Loading students...</p>
          </div>
        </div>
      ) : (
        <StudentTable
          students={filtered}
          onEdit={openEdit}
          onDelete={handleDeleteClick}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      {/* Student Modal (Add/Edit) */}
      {modalOpen && (
        <StudentModal
          student={editStudent}
          batches={batches}
          courses={courses}
          durations={durations}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditStudent(null);
          }}
        />
      )}

      {/* Course Manager Modal */}
      {courseManagerOpen && (
        <CourseManager
          courses={courses}
          durations={durations}
          onClose={() => setCourseManagerOpen(false)}
          onSaved={(c, d) => {
            setCourses(c);
            setDurations(d);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Student?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will permanently remove all their data.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
