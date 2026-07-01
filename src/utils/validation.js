// Validation helpers for form fields

export const validateEmail = (value) => {
  if (!value) return null; // optional field
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
  return null;
};

export const validatePhone = (value) => {
  if (!value) return "Phone number is required";
  if (!/^\d{10}$/.test(value)) return "Must be exactly 10 digits";
  return null;
};

export const validateAadhaar = (value) => {
  if (!value) return "Aadhaar number is required";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 12) return "Aadhaar must be exactly 12 digits";
  return null;
};

export const validateRequired = (value, fieldName = "This field") => {
  if (!value || (typeof value === "string" && !value.trim()))
    return `${fieldName} is required`;
  return null;
};

export const formatAadhaarDisplay = (aadhaar) => {
  if (!aadhaar) return "";
  const d = aadhaar.replace(/\D/g, "");
  return `XXXX-XXXX-${d.slice(-4)}`;
};

export const formatAadhaarInput = (value) => {
  // Format as user types: removes non-digits, keeps max 12
  return value.replace(/\D/g, "").slice(0, 12);
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "—";
  const date =
    timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const calculatePaymentStatus = (student) => {
  if (!student) return "Pending";
  const { paymentType, installments = [], totalFee = 0, fullPaymentDate } = student;
  if (paymentType === "Full Payment") {
    return fullPaymentDate ? "Fully Paid" : "Pending";
  }
  // Installment
  const totalPaid = installments.reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0
  );
  if (totalPaid <= 0) return "Pending";
  if (totalPaid >= Number(totalFee)) return "Fully Paid";
  return "Partial";
};

export const calculateBalanceRemaining = (totalFee, installments = []) => {
  const totalPaid = installments.reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0
  );
  return Math.max(0, Number(totalFee) - totalPaid);
};
