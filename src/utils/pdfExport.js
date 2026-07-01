import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  formatCurrency,
  formatDate,
  formatAadhaarDisplay,
} from "./validation";

// Helper: fetch image URL → base64 data URL
const toBase64 = (url) =>
  fetch(url)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        })
    )
    .catch(() => null);

export const exportStudentPDF = async (student) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Load logo ────────────────────────────────────────────────────────────────
  const logoBase64 = await toBase64("/logo.jpg");

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235); // brand-600
  doc.rect(0, 0, pageW, 42, "F");

  // Logo circle background
  if (logoBase64) {
    doc.setFillColor(255, 255, 255);
    doc.circle(22, 21, 12, "F");
    doc.addImage(logoBase64, "JPEG", 11, 10, 22, 22);
  }

  // Institute name & subtitle (shifted right to make space for logo)
  const textX = logoBase64 ? 38 : 15;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Bihar Digital Data & Network", textX, 15);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Darbhanga, Bihar | www.bddn.in | info@bddn.in", textX, 22);
  doc.text("Admission Receipt", textX, 29);

  // Receipt No & Date (right-aligned)
  doc.setFontSize(9);
  doc.text(`Student ID: ${student.studentId}`, pageW - 15, 15, { align: "right" });
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    pageW - 15,
    22,
    { align: "right" }
  );

  // ── Personal Details ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Personal Details", 15, 52);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(15, 54, pageW - 15, 54);

  const personalRows = [
    ["Student Name", student.name || "—"],
    ["Phone Number", student.phone || "—"],
    ["Alternate Phone", student.alternatePhone || "—"],
    ["Email Address", student.email || "—"],
    ["Aadhaar Number", formatAadhaarDisplay(student.aadhaar) || "—"],
    ["Address", student.address || "—"],
  ];

  doc.autoTable({
    startY: 56,
    head: [],
    body: personalRows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [100, 116, 139] },
      1: { textColor: [30, 41, 59] },
    },
    margin: { left: 15, right: 15 },
  });

  // ── Course Details ──────────────────────────────────────────────────────────
  const afterPersonal = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Course Details", 15, afterPersonal);
  doc.line(15, afterPersonal + 2, pageW - 15, afterPersonal + 2);

  const courseRows = [
    ["Course", student.course || "—"],
    ["Duration", student.courseDuration || "—"],
    ["Mode", student.classMode || "—"],
    ["Batch ID", student.batchId || "—"],
    ["Date of Joining", formatDate(student.dateOfJoining) || "—"],
  ];

  doc.autoTable({
    startY: afterPersonal + 4,
    head: [],
    body: courseRows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [100, 116, 139] },
      1: { textColor: [30, 41, 59] },
    },
    margin: { left: 15, right: 15 },
  });

  // ── Payment Details ─────────────────────────────────────────────────────────
  const afterCourse = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Details", 15, afterCourse);
  doc.line(15, afterCourse + 2, pageW - 15, afterCourse + 2);

  const payRows = [
    ["Total Fee", formatCurrency(student.totalFee)],
    ["Payment Mode", student.paymentMode || "—"],
    ["Payment Type", student.paymentType || "—"],
    ["Payment Status", student.paymentStatus || "—"],
  ];

  if (student.paymentType === "Full Payment" && student.fullPaymentDate) {
    payRows.push(["Full Payment Date", formatDate(student.fullPaymentDate)]);
  }

  doc.autoTable({
    startY: afterCourse + 4,
    head: [],
    body: payRows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [100, 116, 139] },
      1: { textColor: [30, 41, 59] },
    },
    margin: { left: 15, right: 15 },
  });

  // Installments table
  if (
    student.paymentType === "Installment" &&
    student.installments?.length > 0
  ) {
    const afterPay = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Installment History", 15, afterPay);

    doc.autoTable({
      startY: afterPay + 2,
      head: [["#", "Amount", "Date", "Mode", "Balance"]],
      body: student.installments.map((inst, i) => [
        i + 1,
        formatCurrency(inst.amount),
        formatDate(inst.date),
        inst.paymentMode || "—",
        formatCurrency(inst.balance),
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 15, right: 15 },
    });
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This is a computer-generated receipt. No signature required.",
    pageW / 2,
    pageH - 10,
    { align: "center" }
  );

  doc.save(`BDDN_Admission_${student.studentId}_${student.name}.pdf`);
};
