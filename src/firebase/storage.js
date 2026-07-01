import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

export const uploadFile = async (file, path) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
};

export const uploadStudentPhoto = async (studentId, file) => {
  const ext = file.name.split(".").pop();
  return uploadFile(file, `students/${studentId}/photo.${ext}`);
};

export const uploadAadhaarImage = async (studentId, file) => {
  const ext = file.name.split(".").pop();
  return uploadFile(file, `students/${studentId}/aadhaar.${ext}`);
};

export const deleteFile = async (url) => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (e) {
    console.warn("Could not delete file:", e);
  }
};
