import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import {
  db as sheetsDb,
  collection as sheetsCollection,
  doc as sheetsDoc,
  setDoc as sheetsSetDoc,
  getDoc as sheetsGetDoc,
  getDocs as sheetsGetDocs,
  deleteDoc as sheetsDeleteDoc,
  onSnapshot as sheetsOnSnapshot,
} from "./sheetsDb";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Export Google Spreadsheet Database
export const db = sheetsDb;
export const collection = sheetsCollection;
export const doc = sheetsDoc;
export const setDoc = sheetsSetDoc;
export const getDoc = sheetsGetDoc;
export const getDocs = sheetsGetDocs;
export const deleteDoc = sheetsDeleteDoc;
export const onSnapshot = sheetsOnSnapshot;

export default app;
