import React, { useState, useEffect } from "react";
import {
  validatePhone,
  validateEmail,
  validateAadhaar,
  validateRequired,
  formatAadhaarInput,
  calculatePaymentStatus,
} from "../../utils/validation";
import { uploadStudentPhoto, uploadAadhaarImage } from "../../firebase/storage";
import { getNextStudentId } from "../../firebase/firestore";
import { useAuth } from "../../App";
import ImageViewer from "../shared/ImageViewer";
import InstallmentTable from "./InstallmentTable";
import PaymentStatusBadge from "../shared/PaymentStatusBadge";

const MODES = ["Online", "Offline", "Hybrid"];
const PAY_MODES = ["Cash", "UPI", "Bank Transfer", "Card", "Cheque"];

const DEFAULT_FORM = {
  studentId: "",
  name: "",
  phone: "",
  alternatePhone: "",
  email: "",
  aadhaar: "",
  address: "",
  aadhaarImageUrl: "",
  photoUrl: "",
  course: "",
  courseOther: "",
  courseDuration: "",
  courseDurationCustom: "",
  classMode: "Offline",
  batchId: "",
  dateOfJoining: "",
  totalFee: "",
  paymentMode: "Cash",
  paymentType: "Full Payment",
  fullPaymentDate: "",
  installments: [],
  admissionNo: "",
  enrollmentNo: "",
  dob: "",
  gender: "",
  highestQualification: "",
  fatherName: "",
  motherName: "",
  guardianPhone: "",
  guardianRelationship: "",
};

export default function StudentForm({ student, batches = [], courses = [], durations = [], onSave, onCancel }) {
  const { user } = useAuth();
  const isEdit = !!student;

  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // File state
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [showAadhaar, setShowAadhaar] = useState(false);

  // Build course+duration lists with "Other" / "Custom" appended
  const courseOptions = [...courses, "Other"];
  const durationOptions = [...durations, "Custom"];

  // Populate form on edit
  useEffect(() => {
    if (student) {
      setForm({
        ...DEFAULT_FORM,
        ...student,
        courseOther: courses.includes(student.course) ? "" : student.course,
        course: courses.includes(student.course) ? student.course : "Other",
        courseDurationCustom: durations.includes(student.courseDuration)
          ? ""
          : student.courseDuration,
        courseDuration: durations.includes(student.courseDuration)
          ? student.courseDuration
          : "Custom",
        // Convert Firestore timestamp to date string
        dateOfJoining: student.dateOfJoining?.toDate
          ? student.dateOfJoining.toDate().toISOString().slice(0, 10)
          : student.dateOfJoining || "",
        dob: student.dob?.toDate
          ? student.dob.toDate().toISOString().slice(0, 10)
          : student.dob || "",
        fullPaymentDate: student.fullPaymentDate?.toDate
          ? student.fullPaymentDate.toDate().toISOString().slice(0, 10)
          : student.fullPaymentDate || "",
        installments: (student.installments || []).map((inst) => ({
          ...inst,
          date: inst.date?.toDate
            ? inst.date.toDate().toISOString().slice(0, 10)
            : inst.date || "",
        })),
      });
      setAadhaarPreview(student.aadhaarImageUrl || "");
      setPhotoPreview(student.photoUrl || "");
    } else {
      // Set sensible defaults from dynamic lists
      setForm((f) => ({
        ...f,
        course: courses[0] || "",
        courseDuration: durations[0] || "",
      }));
    }
  }, [student, courses, durations]);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const handleAadhaarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAadhaarFile(file);
    setAadhaarPreview(URL.createObjectURL(file));
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    const nameErr = validateRequired(form.name, "Student Name");
    if (nameErr) e.name = nameErr;
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) e.phone = phoneErr;
    if (form.alternatePhone) {
      const altErr = validatePhone(form.alternatePhone);
      if (altErr) e.alternatePhone = "Alternate: " + altErr;
    }
    if (form.guardianPhone) {
      const guardErr = validatePhone(form.guardianPhone);
      if (guardErr) e.guardianPhone = guardErr;
    }
    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;
    const aadhaarErr = validateAadhaar(form.aadhaar);
    if (aadhaarErr) e.aadhaar = aadhaarErr;
    const addressErr = validateRequired(form.address, "Address");
    if (addressErr) e.address = addressErr;
    if (!form.dateOfJoining) e.dateOfJoining = "Date of joining is required";
    if (!form.batchId) e.batchId = "Please select a batch";
    if (form.course === "Other" && !form.courseOther.trim())
      e.courseOther = "Please specify the course name";
    if (form.courseDuration === "Custom" && !form.courseDurationCustom.trim())
      e.courseDurationCustom = "Please specify the duration";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let sid = form.studentId;
      if (!isEdit) {
        sid = await getNextStudentId();
      }

      // Upload files if changed
      let aadhaarImageUrl = form.aadhaarImageUrl;
      let photoUrl = form.photoUrl;

      if (aadhaarFile) {
        aadhaarImageUrl = await uploadAadhaarImage(sid, aadhaarFile);
      }
      if (photoFile) {
        photoUrl = await uploadStudentPhoto(sid, photoFile);
      }

      const finalCourse =
        form.course === "Other" ? form.courseOther : form.course;
      const finalDuration =
        form.courseDuration === "Custom"
          ? form.courseDurationCustom
          : form.courseDuration;

      const payload = {
        studentId: sid,
        name: form.name.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone ? form.alternatePhone.trim() : "",
        email: form.email ? form.email.trim().toLowerCase() : "",
        aadhaar: form.aadhaar.replace(/\D/g, ""),
        address: form.address ? form.address.trim() : "",
        aadhaarImageUrl,
        photoUrl,
        course: finalCourse,
        courseDuration: finalDuration,
        classMode: form.classMode,
        batchId: form.batchId,
        dateOfJoining: form.dateOfJoining,
        totalFee: Number(form.totalFee) || 0,
        paymentMode: form.paymentMode,
        paymentType: form.paymentType,
        fullPaymentDate:
          form.paymentType === "Full Payment" ? form.fullPaymentDate : null,
        installments:
          form.paymentType === "Installment" ? form.installments : [],
        createdBy: user?.email || "unknown",
        admissionNo: form.admissionNo ? form.admissionNo.trim() : "",
        enrollmentNo: form.enrollmentNo ? form.enrollmentNo.trim() : "",
        dob: form.dob || "",
        gender: form.gender || "",
        highestQualification: form.highestQualification ? form.highestQualification.trim() : "",
        fatherName: form.fatherName ? form.fatherName.trim() : "",
        motherName: form.motherName ? form.motherName.trim() : "",
        guardianPhone: form.guardianPhone ? form.guardianPhone.trim() : "",
        guardianRelationship: form.guardianRelationship ? form.guardianRelationship.trim() : "",
      };

      // Auto-calc payment status
      payload.paymentStatus = calculatePaymentStatus(payload);

      await onSave(payload, sid);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const liveStatus = calculatePaymentStatus({
    paymentType: form.paymentType,
    fullPaymentDate: form.fullPaymentDate,
    installments: form.installments,
    totalFee: form.totalFee,
  });

  return (
    <div>
      {/* ── Admission Details ─────────────────────────────────── */}
      <div className="form-section">
        <p className="form-section-title">📝 Admission Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Admission No. */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-admission-no">
              Admission No.
            </label>
            <input
              id="f-admission-no"
              type="text"
              className="field-input"
              placeholder="Enter Admission Number"
              value={form.admissionNo || ""}
              onChange={(e) => set("admissionNo", e.target.value)}
            />
          </div>

          {/* Enrollment No. */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-enrollment-no">
              Enrollment No.
            </label>
            <input
              id="f-enrollment-no"
              type="text"
              className="field-input"
              placeholder="Enter Enrollment Number"
              value={form.enrollmentNo || ""}
              onChange={(e) => set("enrollmentNo", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Personal Details ─────────────────────────────────── */}
      <div className="form-section">
        <p className="form-section-title">👤 Personal Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Student Name */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-name">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              id="f-name"
              type="text"
              className={`field-input ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
              placeholder="Full name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-phone">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="f-phone"
              type="tel"
              className={`field-input ${errors.phone ? "border-red-400 focus:ring-red-400" : ""}`}
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
            />
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>

          {/* Alternate Phone */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-alt-phone">
              Alternate Phone <span className="text-slate-400 font-normal text-xs">(Optional)</span>
            </label>
            <input
              id="f-alt-phone"
              type="tel"
              className={`field-input ${errors.alternatePhone ? "border-red-400 focus:ring-red-400" : ""}`}
              placeholder="10-digit alternate number"
              value={form.alternatePhone}
              onChange={(e) => set("alternatePhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
            />
            {errors.alternatePhone && <p className="field-error">{errors.alternatePhone}</p>}
          </div>

          {/* Date of Birth */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-dob">
              Date of Birth <span className="text-slate-400 font-normal text-xs">(DD/MM/YYYY)</span>
            </label>
            <input
              id="f-dob"
              type="date"
              className="field-input"
              value={form.dob || ""}
              onChange={(e) => set("dob", e.target.value)}
            />
          </div>

          {/* Gender */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-gender">
              Gender
            </label>
            <select
              id="f-gender"
              className="field-select"
              value={form.gender || ""}
              onChange={(e) => set("gender", e.target.value)}
            >
              <option value="">— Select Gender —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Email */}
          <div className="field-group sm:col-span-2">
            <label className="field-label" htmlFor="f-email">
              Email Address <span className="text-slate-400 font-normal text-xs">(Optional)</span>
            </label>
            <input
              id="f-email"
              type="email"
              className={`field-input ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
              placeholder="student@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          {/* Aadhaar */}
          <div className="field-group sm:col-span-2">
            <label className="field-label" htmlFor="f-aadhaar">
              Aadhaar Card Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="f-aadhaar"
                type={showAadhaar ? "text" : "password"}
                className={`field-input pr-16 ${errors.aadhaar ? "border-red-400 focus:ring-red-400" : ""}`}
                placeholder="12-digit Aadhaar number"
                value={form.aadhaar}
                onChange={(e) => set("aadhaar", formatAadhaarInput(e.target.value))}
                maxLength={12}
              />
              <button
                type="button"
                onClick={() => setShowAadhaar(!showAadhaar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                {showAadhaar ? "Hide" : "Show"}
              </button>
            </div>
            {errors.aadhaar && <p className="field-error">{errors.aadhaar}</p>}
          </div>

          {/* Highest Qualification */}
          <div className="field-group sm:col-span-2">
            <label className="field-label" htmlFor="f-highest-qualification">
              Highest Qualification
            </label>
            <input
              id="f-highest-qualification"
              type="text"
              className="field-input"
              placeholder="e.g. Graduate, Class 12"
              value={form.highestQualification || ""}
              onChange={(e) => set("highestQualification", e.target.value)}
            />
          </div>

          {/* Address */}
          <div className="field-group sm:col-span-2">
            <label className="field-label" htmlFor="f-address">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="f-address"
              className={`field-input min-h-[70px] resize-y ${errors.address ? "border-red-400 focus:ring-red-400" : ""}`}
              placeholder="Full resident address"
              value={form.address || ""}
              onChange={(e) => set("address", e.target.value)}
            />
            {errors.address && <p className="field-error">{errors.address}</p>}
          </div>
        </div>

        {/* Image uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="field-label">
              Aadhaar Card Image (Optional)
            </label>
            <label
              htmlFor="f-aadhaar-img"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all text-sm text-slate-500 hover:text-brand-600 mb-2"
            >
              📎 {aadhaarFile ? aadhaarFile.name : "Click to upload Aadhaar image"}
              <input
                id="f-aadhaar-img"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAadhaarFileChange}
              />
            </label>
            <ImageViewer url={aadhaarPreview} label="Aadhaar Card" />
          </div>

          <div>
            <label className="field-label">Student Photo (Optional)</label>
            <label
              htmlFor="f-photo"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all text-sm text-slate-500 hover:text-brand-600 mb-2"
            >
              🖼️ {photoFile ? photoFile.name : "Click to upload student photo"}
              <input
                id="f-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoFileChange}
              />
            </label>
            <ImageViewer url={photoPreview} label="Student Photo" />
          </div>
        </div>
      </div>

      {/* ── Parent / Guardian Details ─────────────────────────── */}
      <div className="form-section">
        <p className="form-section-title">👨‍👩‍👦 Parent / Guardian Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Father's Name */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-father-name">
              Father's Name
            </label>
            <input
              id="f-father-name"
              type="text"
              className="field-input"
              placeholder="Father's full name"
              value={form.fatherName || ""}
              onChange={(e) => set("fatherName", e.target.value)}
            />
          </div>

          {/* Mother's Name */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-mother-name">
              Mother's Name
            </label>
            <input
              id="f-mother-name"
              type="text"
              className="field-input"
              placeholder="Mother's full name"
              value={form.motherName || ""}
              onChange={(e) => set("motherName", e.target.value)}
            />
          </div>

          {/* Guardian's Contact Number */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-guardian-phone">
              Guardian's Contact Number
            </label>
            <input
              id="f-guardian-phone"
              type="tel"
              className={`field-input ${errors.guardianPhone ? "border-red-400 focus:ring-red-400" : ""}`}
              placeholder="10-digit contact number"
              value={form.guardianPhone || ""}
              onChange={(e) => set("guardianPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
            />
            {errors.guardianPhone && <p className="field-error">{errors.guardianPhone}</p>}
          </div>

          {/* Relationship with Student */}
          <div className="field-group">
            <label className="field-label" htmlFor="f-guardian-rel">
              Relationship with Student
            </label>
            <input
              id="f-guardian-rel"
              type="text"
              className="field-input"
              placeholder="e.g. Father, Mother, Brother, Uncle"
              value={form.guardianRelationship || ""}
              onChange={(e) => set("guardianRelationship", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Course Details ────────────────────────────────────── */}
      <div className="form-section">
        <p className="form-section-title">📚 Course Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="field-group">
            <label className="field-label" htmlFor="f-course">Course Name <span className="text-red-500">*</span></label>
            <select id="f-course" className="field-select" value={form.course} onChange={(e) => set("course", e.target.value)}>
              {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.course === "Other" && (
              <input
                id="f-course-other"
                type="text"
                className={`field-input mt-2 ${errors.courseOther ? "border-red-400" : ""}`}
                placeholder="Type course name"
                value={form.courseOther}
                onChange={(e) => set("courseOther", e.target.value)}
              />
            )}
            {errors.courseOther && <p className="field-error">{errors.courseOther}</p>}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="f-duration">Course Duration</label>
            <select id="f-duration" className="field-select" value={form.courseDuration} onChange={(e) => set("courseDuration", e.target.value)}>
              {durationOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {form.courseDuration === "Custom" && (
              <input
                id="f-duration-custom"
                type="text"
                className={`field-input mt-2 ${errors.courseDurationCustom ? "border-red-400" : ""}`}
                placeholder="e.g. 4 Months"
                value={form.courseDurationCustom}
                onChange={(e) => set("courseDurationCustom", e.target.value)}
              />
            )}
            {errors.courseDurationCustom && <p className="field-error">{errors.courseDurationCustom}</p>}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="f-mode">Mode of Classes</label>
            <select id="f-mode" className="field-select" value={form.classMode} onChange={(e) => set("classMode", e.target.value)}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="f-batch">
              Batch ID <span className="text-red-500">*</span>
            </label>
            <select
              id="f-batch"
              className={`field-select ${errors.batchId ? "border-red-400" : ""}`}
              value={form.batchId}
              onChange={(e) => set("batchId", e.target.value)}
            >
              <option value="">— Select Batch —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.batchId}>{b.batchId}</option>
              ))}
            </select>
            {errors.batchId && <p className="field-error">{errors.batchId}</p>}
            <p className="text-xs text-slate-400 mt-1">
              Don't see your batch? Go to{" "}
              <a href="/batches" className="text-brand-600 hover:underline">Batch Management</a>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Admission & Payment ───────────────────────────────── */}
      <div className="form-section">
        <p className="form-section-title">💳 Admission & Payment Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="field-group">
            <label className="field-label" htmlFor="f-joining">
              Date of Joining <span className="text-red-500">*</span>
            </label>
            <input
              id="f-joining"
              type="date"
              className={`field-input ${errors.dateOfJoining ? "border-red-400" : ""}`}
              value={form.dateOfJoining}
              onChange={(e) => set("dateOfJoining", e.target.value)}
            />
            {errors.dateOfJoining && <p className="field-error">{errors.dateOfJoining}</p>}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="f-fee">Total Course Fee (₹)</label>
            <input
              id="f-fee"
              type="number"
              className="field-input"
              placeholder="0"
              value={form.totalFee}
              onChange={(e) => set("totalFee", e.target.value)}
              min={0}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="f-pay-mode">Payment Mode</label>
            <select id="f-pay-mode" className="field-select" value={form.paymentMode} onChange={(e) => set("paymentMode", e.target.value)}>
              {PAY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="f-pay-type">Payment Type</label>
            <select id="f-pay-type" className="field-select" value={form.paymentType} onChange={(e) => set("paymentType", e.target.value)}>
              <option value="Full Payment">Full Payment</option>
              <option value="Installment">Installment</option>
            </select>
          </div>

          {/* Full payment date */}
          {form.paymentType === "Full Payment" && (
            <div className="field-group sm:col-span-2">
              <label className="field-label" htmlFor="f-full-date">Date of Full Payment</label>
              <input
                id="f-full-date"
                type="date"
                className="field-input"
                value={form.fullPaymentDate}
                onChange={(e) => set("fullPaymentDate", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Installments */}
        {form.paymentType === "Installment" && (
          <div className="mt-4">
            <label className="field-label">Installment History</label>
            <InstallmentTable
              installments={form.installments}
              totalFee={form.totalFee}
              onChange={(val) => set("installments", val)}
            />
          </div>
        )}

        {/* Live payment status preview */}
        <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-sm font-medium text-slate-600">Payment Status Preview:</span>
          <PaymentStatusBadge status={liveStatus} />
        </div>
      </div>

      {/* System Info (Edit only) */}
      {isEdit && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-0.5 mb-4">
          <p>🆔 Student ID: <span className="font-semibold text-slate-700">{form.studentId}</span></p>
          <p>👤 Created By: <span className="font-semibold text-slate-700">{form.createdBy}</span></p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button id="form-cancel-btn" type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button
          id="form-save-btn"
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <>
              <div className="spinner" />
              Saving...
            </>
          ) : isEdit ? (
            "✅ Update Student"
          ) : (
            "✅ Add Student"
          )}
        </button>
      </div>
    </div>
  );
}
