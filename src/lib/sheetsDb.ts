import {
  Petugas,
  RencanaBulanan,
  RencanaHarian,
  KegiatanHarian,
  LaporanTemplate,
  Lisensi,
  ModulP2K2,
  AppSettings,
} from "../types";

export interface DatabaseSchema {
  petugas: Petugas[];
  rencana_bulanan: RencanaBulanan[];
  rencana_harian: RencanaHarian[];
  kegiatan_harian: KegiatanHarian[];
  laporan: LaporanTemplate[];
  lisensi: Lisensi[];
  modul_p2k2: ModulP2K2[];
  app_settings: Record<string, AppSettings & { isSeeded?: boolean; seededAt?: string }>;
}

const STORAGE_KEY = "laporan_skp_google_sheets_db";

type CollectionName = keyof DatabaseSchema;

type ListenerCallback = (docs: any[]) => void;
type DocListenerCallback = (doc: { exists: () => boolean; data: () => any; id: string }) => void;

class GoogleSheetsDatabase {
  private data: DatabaseSchema;
  private listeners: Map<CollectionName, Set<ListenerCallback>> = new Map();
  private docListeners: Map<string, Set<DocListenerCallback>> = new Map();
  private syncTimeout: any = null;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    const defaultData: DatabaseSchema = {
      petugas: [],
      rencana_bulanan: [],
      rencana_harian: [],
      kegiatan_harian: [],
      laporan: [],
      lisensi: [],
      modul_p2k2: [],
      app_settings: {},
    };

    if (typeof window === "undefined") return defaultData;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          petugas: parsed.petugas || [],
          rencana_bulanan: parsed.rencana_bulanan || [],
          rencana_harian: parsed.rencana_harian || [],
          kegiatan_harian: parsed.kegiatan_harian || [],
          laporan: parsed.laporan || [],
          lisensi: parsed.lisensi || [],
          modul_p2k2: parsed.modul_p2k2 || [],
          app_settings: parsed.app_settings || {},
        };
      }
    } catch (e) {
      console.error("Gagal membaca Google Sheets database dari storage:", e);
    }
    return defaultData;
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Gagal menyimpan Google Sheets database ke storage:", e);
    }
    this.scheduleRemoteSync();
  }

  private notifyListeners(col: CollectionName) {
    const colListeners = this.listeners.get(col);
    if (colListeners) {
      const currentList = this.getCollectionDocs(col);
      colListeners.forEach((cb) => {
        try {
          cb(currentList);
        } catch (err) {
          console.error("Listener error:", err);
        }
      });
    }

    // Notify doc listeners
    this.docListeners.forEach((listeners, key) => {
      const [docCol, docId] = key.split("/");
      if (docCol === col) {
        const docData = this.getDoc(docCol as CollectionName, docId);
        const snap = {
          exists: () => !!docData,
          data: () => docData,
          id: docId,
        };
        listeners.forEach((cb) => cb(snap));
      }
    });
  }

  public getCollectionDocs(col: CollectionName): any[] {
    if (col === "app_settings") {
      return Object.entries(this.data.app_settings || {}).map(([id, val]) => ({
        id,
        ...val,
      }));
    }
    return this.data[col] || [];
  }

  public getDoc(col: CollectionName, docId: string): any | null {
    if (col === "app_settings") {
      return this.data.app_settings[docId] || null;
    }
    const list = this.data[col] || [];
    return list.find((item: any) => item.id === docId) || null;
  }

  public setDoc(
    col: CollectionName,
    docId: string,
    newData: any,
    options?: { merge?: boolean }
  ) {
    const cleanNewData = JSON.parse(JSON.stringify(newData));

    if (col === "app_settings") {
      if (!this.data.app_settings) this.data.app_settings = {};
      const existing = this.data.app_settings[docId] || {};
      this.data.app_settings[docId] = options?.merge
        ? { ...existing, ...cleanNewData }
        : cleanNewData;
    } else {
      const list = [...(this.data[col] || [])];
      const idx = list.findIndex((item: any) => item.id === docId);

      const recordToSave = { id: docId, ...cleanNewData };

      if (idx >= 0) {
        if (options?.merge) {
          list[idx] = { ...list[idx], ...cleanNewData, id: docId };
        } else {
          list[idx] = recordToSave;
        }
      } else {
        list.push(recordToSave);
      }
      this.data[col] = list as any;
    }

    this.saveToStorage();
    this.notifyListeners(col);
    return true;
  }

  public deleteDoc(col: CollectionName, docId: string) {
    if (col === "app_settings") {
      if (this.data.app_settings && this.data.app_settings[docId]) {
        delete this.data.app_settings[docId];
        this.saveToStorage();
        this.notifyListeners(col);
      }
    } else {
      const list = this.data[col] || [];
      const updated = list.filter((item: any) => item.id !== docId);
      this.data[col] = updated as any;
      this.saveToStorage();
      this.notifyListeners(col);
    }
    return true;
  }

  public subscribe(col: CollectionName, callback: ListenerCallback): () => void {
    if (!this.listeners.has(col)) {
      this.listeners.set(col, new Set());
    }
    this.listeners.get(col)!.add(callback);

    // Initial emit
    setTimeout(() => {
      callback(this.getCollectionDocs(col));
    }, 0);

    return () => {
      this.listeners.get(col)?.delete(callback);
    };
  }

  public subscribeDoc(
    col: CollectionName,
    docId: string,
    callback: DocListenerCallback
  ): () => void {
    const key = `${col}/${docId}`;
    if (!this.docListeners.has(key)) {
      this.docListeners.set(key, new Set());
    }
    this.docListeners.get(key)!.add(callback);

    // Initial emit
    setTimeout(() => {
      const docData = this.getDoc(col, docId);
      callback({
        exists: () => !!docData,
        data: () => docData,
        id: docId,
      });
    }, 0);

    return () => {
      this.docListeners.get(key)?.delete(callback);
    };
  }

  public getFullDatabase(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  public replaceFullDatabase(newData: Partial<DatabaseSchema>) {
    this.data = {
      petugas: newData.petugas || [],
      rencana_bulanan: newData.rencana_bulanan || [],
      rencana_harian: newData.rencana_harian || [],
      kegiatan_harian: newData.kegiatan_harian || [],
      laporan: newData.laporan || [],
      lisensi: newData.lisensi || [],
      modul_p2k2: newData.modul_p2k2 || [],
      app_settings: newData.app_settings || {},
    };
    this.saveToStorage();
    (Object.keys(this.data) as CollectionName[]).forEach((col) => {
      this.notifyListeners(col);
    });
  }

  // Schedule remote sync with server / Google Sheets API if configured
  private scheduleRemoteSync() {
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(async () => {
      try {
        await fetch("/api/sheets-db/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.data),
        }).catch(() => {
          // Ignore network errors, local storage is persistent
        });
      } catch {
        // Ignore
      }
    }, 1500);
  }
}

export const sheetsDbInstance = new GoogleSheetsDatabase();

// --- Firestore-like Adapter Functions ---
export const db = sheetsDbInstance;

export function collection(_db: any, name: string) {
  return { colName: name as CollectionName };
}

export function doc(_db: any, name: string, id: string) {
  return { colName: name as CollectionName, docId: id };
}

export function onSnapshot(target: any, callback: any, onError?: any) {
  if (target && target.docId) {
    return sheetsDbInstance.subscribeDoc(
      target.colName,
      target.docId,
      (docSnap) => {
        callback(docSnap);
      }
    );
  } else if (target && target.colName) {
    return sheetsDbInstance.subscribe(target.colName, (docs) => {
      const snap = {
        empty: docs.length === 0,
        docs: docs.map((d) => ({
          id: d.id,
          data: () => d,
        })),
        forEach: (fn: (doc: any) => void) => {
          docs.forEach((d) => fn({ id: d.id, data: () => d }));
        },
      };
      callback(snap);
    });
  }
  return () => {};
}

export async function getDocs(ref: { colName: CollectionName }) {
  const docs = sheetsDbInstance.getCollectionDocs(ref.colName);
  return {
    empty: docs.length === 0,
    docs: docs.map((d) => ({ id: d.id, data: () => d })),
    forEach: (fn: (doc: any) => void) => {
      docs.forEach((d) => fn({ id: d.id, data: () => d }));
    },
  };
}

export async function getDoc(ref: { colName: CollectionName; docId: string }) {
  const d = sheetsDbInstance.getDoc(ref.colName, ref.docId);
  return {
    exists: () => !!d,
    data: () => d,
    id: ref.docId,
  };
}

export async function setDoc(
  ref: { colName: CollectionName; docId: string },
  data: any,
  options?: { merge?: boolean }
) {
  sheetsDbInstance.setDoc(ref.colName, ref.docId, data, options);
  return true;
}

export async function deleteDoc(ref: { colName: CollectionName; docId: string }) {
  sheetsDbInstance.deleteDoc(ref.colName, ref.docId);
  return true;
}
