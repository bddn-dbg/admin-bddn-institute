import * as XLSX from "xlsx";
import { formatDate, formatCurrency } from "./validation";

export const exportStudentsExcel = (students) => {
  const rows = students.map((s) => ({
    "Student ID": s.studentId || "",
    Name: s.name || "",
    Phone: s.phone || "",
    "Aadhaar (Last 4)": s.aadhaar ? `XXXX-XXXX-${s.aadhaar.slice(-4)}` : "",
    Address: s.address || "",
    Course: s.course || "",
    "Course Duration": s.courseDuration || "",
    "Class Mode": s.classMode || "",
    "Batch ID": s.batchId || "",
    "Date of Joining": formatDate(s.dateOfJoining),
    "Total Fee (₹)": s.totalFee || 0,
    "Payment Mode": s.paymentMode || "",
    "Payment Type": s.paymentType || "",
    "Payment Status": s.paymentStatus || "",
    "Amount Paid (₹)":
      s.paymentType === "Installment"
        ? s.installments?.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) || 0
        : s.paymentType === "Full Payment" && s.fullPaymentDate
        ? s.totalFee
        : 0,
    "Installments Count": s.installments?.length || 0,
    "Created By": s.createdBy || "",
    "Created At": formatDate(s.createdAt),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 14 }, // Student ID
    { wch: 22 }, // Name
    { wch: 14 }, // Phone
    { wch: 18 }, // Aadhaar
    { wch: 30 }, // Address
    { wch: 28 }, // Course
    { wch: 16 }, // Duration
    { wch: 12 }, // Mode
    { wch: 14 }, // Batch ID
    { wch: 16 }, // Joining Date
    { wch: 14 }, // Total Fee
    { wch: 16 }, // Pay Mode
    { wch: 16 }, // Pay Type
    { wch: 16 }, // Status
    { wch: 16 }, // Amount Paid
    { wch: 18 }, // Installments
    { wch: 22 }, // Created By
    { wch: 14 }, // Created At
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  // Installments detail sheet
  const instRows = [];
  students.forEach((s) => {
    if (s.installments?.length) {
      s.installments.forEach((inst, i) => {
        instRows.push({
          "Student ID": s.studentId,
          "Student Name": s.name,
          "Installment #": i + 1,
          "Amount (₹)": inst.amount || 0,
          Date: formatDate(inst.date),
          "Payment Mode": inst.paymentMode || "",
          "Balance (₹)": inst.balance || 0,
        });
      });
    }
  });

  if (instRows.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(instRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Installments");
  }

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `BDDN_Students_${date}.xlsx`);
};

export const exportStudentsCSV = (students) => {
  const rows = students.map((s) => ({
    "Student ID": s.studentId || "",
    Name: s.name || "",
    Phone: s.phone || "",
    "Aadhaar (Last 4)": s.aadhaar ? `XXXX-XXXX-${s.aadhaar.slice(-4)}` : "",
    Address: s.address || "",
    Course: s.course || "",
    "Course Duration": s.courseDuration || "",
    "Class Mode": s.classMode || "",
    "Batch ID": s.batchId || "",
    "Date of Joining": formatDate(s.dateOfJoining),
    "Total Fee (₹)": s.totalFee || 0,
    "Payment Mode": s.paymentMode || "",
    "Payment Type": s.paymentType || "",
    "Payment Status": s.paymentStatus || "",
    "Amount Paid (₹)":
      s.paymentType === "Installment"
        ? s.installments?.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) || 0
        : s.paymentType === "Full Payment" && s.fullPaymentDate
        ? s.totalFee
        : 0,
    "Installments Count": s.installments?.length || 0,
    "Created By": s.createdBy || "",
    "Created At": formatDate(s.createdAt),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `BDDN_Students_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
