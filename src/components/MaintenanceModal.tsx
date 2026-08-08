import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wrench,
  AlertTriangle,
  Clock,
  RefreshCw,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  Key,
  Info
} from "lucide-react";
import { MaintenanceSettings, Petugas } from "../types";

interface MaintenanceModalProps {
  settings?: MaintenanceSettings;
  currentUser: Petugas | null;
  onOpenAdminLogin?: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  settings,
  currentUser,
  onOpenAdminLogin,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // If maintenance mode is disabled, render nothing
  if (!settings?.enabled) return null;

  // Maintenance mode ONLY affects non-admin users (Level USER or logged out users)
  // If currentUser is ADMIN, they bypass the screen
  const isAdmin = currentUser?.level === "ADMIN";

  if (isAdmin) {
    return (
      <div className="bg-amber-500 dark:bg-amber-600 text-slate-950 font-sans text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm border-b border-amber-400">
        <div className="flex items-center gap-2 font-medium">
          <Wrench className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>
            <strong>Mode Perawatan Aktif!</strong> Halaman ini sedang dikunci/diberi peringatan untuk level <strong>USER</strong>. (Level Admin dapat beraktivitas normal).
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-slate-950/20 text-slate-950 text-[10px] font-mono font-bold rounded-full border border-slate-950/20">
            {settings.allowDismiss ? "Dapat Ditutup User" : "Terkunci (Tidak Bisa Ditutup)"}
          </span>
        </div>
      </div>
    );
  }

  // Determine if modal can be closed
  const allowDismiss = !!settings.allowDismiss;

  // Title & Message defaults
  const title = settings.title || "Sistem Dalam Perawatan";
  const message =
    settings.message ||
    "Aplikasi Laporan SKP Online saat ini sedang dalam proses pemeliharaan rutin dan peningkatan sistem server untuk menjaga stabilitas dan kecepatan data.";
  const estimatedCompletion = settings.estimatedCompletion;

  // If allowDismiss is false, force isDismissed to false
  const activeDismissed = allowDismiss ? isDismissed : false;

  return (
    <>
      {/* TOP FLOATING BANNER (When User Dismissed the Modal) */}
      {activeDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white shadow-md border-b border-amber-400/50 px-4 py-2.5"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <span className="p-1 bg-amber-700/50 rounded-md shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-200" />
              </span>
              <div>
                <strong className="font-semibold text-amber-100">
                  Mode Perawatan Aktif:
                </strong>{" "}
                <span>
                  Aplikasi sedang dirawat.{" "}
                  {estimatedCompletion && (
                    <span className="font-medium text-amber-100">
                      (Estimasi selesai: {estimatedCompletion})
                    </span>
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(false)}
              className="px-3 py-1 bg-white text-slate-900 hover:bg-amber-50 text-[11px] font-bold rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>Lihat Detail Pesan</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* FULL-SCREEN MAINTENANCE MODAL OVERLAY */}
      <AnimatePresence>
        {!activeDismissed && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
            >
              {/* Top Accent Gradient Line */}
              <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

              {/* Close Button if Allowed */}
              {allowDismiss && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  title="Tutup Notifikasi"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="p-6 sm:p-8 space-y-6">
                {/* Header Icon & Status Badge */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
                      <Wrench className="w-10 h-10 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 text-slate-950 rounded-full shadow-md border-2 border-white dark:border-slate-900">
                      {allowDismiss ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold border border-amber-300/60 dark:border-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Aplikasi Sedang Perawatan</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {title}
                  </h2>
                </div>

                {/* Main Description */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-center">
                  {message}
                </div>

                {/* Estimated Time Box if available */}
                {estimatedCompletion && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-semibold">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Estimasi Selesai: {estimatedCompletion}</span>
                  </div>
                )}

                {/* Lock Status Policy Note */}
                <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                  {allowDismiss ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        Pesan ini <strong>dapat Anda tutup</strong> untuk melanjutkan penggunaan aplikasi secara terbatas.
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        Mode ini <strong>dikunci oleh Admin</strong>. Halaman tidak dapat ditutup hingga perawatan selesai.
                      </span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  {allowDismiss ? (
                    <button
                      onClick={() => setIsDismissed(true)}
                      className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saya Mengerti, Tutup Pesan</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Muat Ulang Halaman</span>
                    </button>
                  )}

                  {/* Option for Admin Login if user is not logged in as Admin */}
                  {onOpenAdminLogin && !isAdmin && (
                    <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={onOpenAdminLogin}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Akses Login Khusus Admin</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
