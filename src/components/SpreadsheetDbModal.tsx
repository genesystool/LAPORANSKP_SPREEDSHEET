import React, { useState } from "react";
import { sheetsDbInstance, DatabaseSchema } from "../lib/sheetsDb";
import { Table, Search, Download, RefreshCw, X, Database, FileSpreadsheet, Layers, ShieldCheck } from "lucide-react";

interface SpreadsheetDbModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SheetTab = keyof DatabaseSchema;

const TAB_LABELS: Record<SheetTab, { label: string; iconName: string }> = {
  petugas: { label: "Sheet: Petugas", iconName: "Users" },
  rencana_bulanan: { label: "Sheet: Rencana Bulanan", iconName: "Calendar" },
  rencana_harian: { label: "Sheet: Rencana Harian", iconName: "ListTodo" },
  kegiatan_harian: { label: "Sheet: Kegiatan Harian", iconName: "ClipboardList" },
  laporan: { label: "Sheet: Master Laporan", iconName: "FileText" },
  lisensi: { label: "Sheet: Master Lisensi", iconName: "Key" },
  modul_p2k2: { label: "Sheet: Modul P2K2", iconName: "BookOpen" },
  app_settings: { label: "Sheet: App Settings", iconName: "Settings" },
};

export const SpreadsheetDbModal: React.FC<SpreadsheetDbModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SheetTab>("kegiatan_harian");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  if (!isOpen) return null;

  const fullDb = sheetsDbInstance.getFullDatabase();
  const rawDocs = sheetsDbInstance.getCollectionDocs(activeTab);

  // Filter records
  const filteredDocs = rawDocs.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const str = JSON.stringify(doc).toLowerCase();
    return str.includes(searchQuery.toLowerCase());
  });

  // Extract columns dynamically
  const columns: string[] = [];
  if (rawDocs.length > 0) {
    const keysSet = new Set<string>();
    rawDocs.forEach((d) => {
      Object.keys(d).forEach((k) => keysSet.add(k));
    });
    // Put 'id' first
    if (keysSet.has("id")) {
      columns.push("id");
      keysSet.delete("id");
    }
    keysSet.forEach((k) => columns.push(k));
  }

  const handleExportCSV = () => {
    if (filteredDocs.length === 0) return;
    const header = columns.join(",");
    const rows = filteredDocs.map((doc) => {
      return columns
        .map((col) => {
          const val = doc[col];
          if (val === undefined || val === null) return '""';
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
    });
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `google_spreadsheet_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Google Spreadsheet Database Inspector
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center gap-1 border border-emerald-300/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyimpanan Database Google Spreadsheet versi Realtime Online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector bar (Sheets) */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-2 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {(Object.keys(TAB_LABELS) as SheetTab[]).map((tab) => {
            const count = (fullDb[tab] ? (Array.isArray(fullDb[tab]) ? (fullDb[tab] as any[]).length : Object.keys(fullDb[tab]).length) : 0);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery("");
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-200/60 dark:border-emerald-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{TAB_LABELS[tab].label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                    isActive
                      ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Action Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari baris di ${TAB_LABELS[activeTab].label}...`}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredDocs.length === 0}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export Sheet CSV
            </button>
          </div>
        </div>

        {/* Spreadsheet Grid Table */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100/50 dark:bg-slate-950/50">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Table className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">Tidak ada baris data di sheet {activeTab}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-sans border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center font-bold">#</th>
                      {columns.map((col) => (
                        <th key={col} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredDocs.map((docItem, idx) => (
                      <tr
                        key={docItem.id || idx}
                        className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-colors"
                      >
                        <td className="py-2 px-3 text-center text-slate-400 text-[10px] font-bold">
                          {idx + 1}
                        </td>
                        {columns.map((col) => {
                          const val = docItem[col];
                          let formattedVal = "";
                          if (val === undefined || val === null) {
                            formattedVal = "-";
                          } else if (typeof val === "object") {
                            formattedVal = JSON.stringify(val);
                          } else {
                            formattedVal = String(val);
                          }
                          return (
                            <td key={col} className="py-2 px-3 max-w-xs truncate" title={formattedVal}>
                              {formattedVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              Google Spreadsheet Database active: <strong>8 Sheets synced</strong>
            </span>
          </div>
          <div>
            Total <strong>{filteredDocs.length}</strong> baris ditampilkan
          </div>
        </div>
      </div>
    </div>
  );
};
