import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./config";

// ─── Course & Duration Settings ──────────────────────────────────────────────
const DEFAULT_COURSES = [
  "Data Analytics & Python",
  "Digital Marketing Specialist",
  "Excel & Power BI",
];
const DEFAULT_DURATIONS = ["3 Months", "6 Months"];

export const getCourseSettings = async () => {
  const ref = doc(db, "settings", "courses");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Initialize with defaults
    await setDoc(ref, { courses: DEFAULT_COURSES, durations: DEFAULT_DURATIONS });
    return { courses: DEFAULT_COURSES, durations: DEFAULT_DURATIONS };
  }
  return snap.data();
};

export const saveCourseSettings = async (courses, durations) => {
  const ref = doc(db, "settings", "courses");
  await setDoc(ref, { courses, durations }, { merge: true });
};


// ─── Counter for auto-increment Student ID ───────────────────────────────────
export const getNextStudentId = async () => {
  const counterRef = doc(db, "counters", "studentId");
  let nextNum = 1;
  await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    if (!counterDoc.exists()) {
      transaction.set(counterRef, { value: 1 });
      nextNum = 1;
    } else {
      nextNum = counterDoc.data().value + 1;
      transaction.update(counterRef, { value: nextNum });
    }
  });
  return `BDDN-${String(nextNum).padStart(4, "0")}`;
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const addStudent = async (data) => {
  const ref = collection(db, "students");
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getAllStudents = async () => {
  const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getStudentById = async (id) => {
  const snap = await getDoc(doc(db, "students", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateStudent = async (id, data) => {
  await updateDoc(doc(db, "students", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteStudent = async (id) => {
  await deleteDoc(doc(db, "students", id));
};

// ─── Batches ──────────────────────────────────────────────────────────────────
export const getAllBatches = async () => {
  const q = query(collection(db, "batches"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addBatch = async (batchId, label = "") => {
  await addDoc(collection(db, "batches"), {
    batchId,
    label,
    createdAt: serverTimestamp(),
  });
};

export const deleteBatch = async (id) => {
  await deleteDoc(doc(db, "batches", id));
};

export const getStudentsByBatch = async (batchId) => {
  const q = query(
    collection(db, "students"),
    where("batchId", "==", batchId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Admin Resources (Links) ──────────────────────────────────────────────────
export const getAllResources = async () => {
  const q = query(collection(db, "resources"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addResource = async (caption, url) => {
  const ref = collection(db, "resources");
  const docRef = await addDoc(ref, {
    caption,
    url,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateResource = async (id, data) => {
  await updateDoc(doc(db, "resources", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteResource = async (id) => {
  await deleteDoc(doc(db, "resources", id));
};
