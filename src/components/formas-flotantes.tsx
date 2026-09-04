"use client";

import { motion } from "framer-motion";

/**
 * Formas decorativas flotantes (sin librería de renders 3D: gradientes +
 * animación sutil para dar sensación de profundidad y movimiento). Cada
 * una flota con su propio ritmo para que no se vea todo sincronizado.
 * Se usa en las pantallas de entrada (reserva pública y login del admin).
 */
export function FormasFlotantes() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <motion.div
        className="absolute left-[6%] top-[2%] h-16 w-16 shadow-lg shadow-violet-200"
        style={{
          background: "radial-gradient(circle at 32% 28%, #ddd6fe, #7c3aed)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}
        animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[10%] top-[6%] h-20 w-12 rounded-full shadow-lg shadow-sky-200"
        style={{ background: "linear-gradient(160deg, #7dd3fc, #2563eb)" }}
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
      <motion.div
        className="absolute right-[4%] top-[24%] h-10 w-10 rounded-2xl shadow-lg shadow-amber-200"
        style={{ background: "linear-gradient(150deg, #fde68a, #f97316)" }}
        animate={{ y: [0, -10, 0], rotate: [45, 60, 45] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />
      <motion.div
        className="absolute left-[10%] bottom-[16%] h-9 w-9 rounded-full shadow-lg shadow-rose-200"
        style={{ background: "radial-gradient(circle at 35% 30%, #fecdd3, #e11d48)" }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.div
        className="absolute right-[8%] bottom-[8%] h-12 w-12 shadow-lg shadow-emerald-200"
        style={{
          background: "linear-gradient(160deg, #6ee7b7, #059669)",
          borderRadius: "40% 60% 65% 35% / 45% 40% 60% 55%",
        }}
        animate={{ y: [0, -12, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />
    </div>
  );
}
