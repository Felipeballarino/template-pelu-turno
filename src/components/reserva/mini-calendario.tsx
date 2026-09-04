"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { grillaMes, inicioMes, mesAnterior, mesSiguiente, nombreMes } from "@/lib/semana";

const DIAS_CORTOS = ["L", "M", "M", "J", "V", "S", "D"];

interface MiniCalendarioProps {
  value: string; // YYYY-MM-DD
  minFecha: string; // YYYY-MM-DD, días anteriores quedan deshabilitados
  onChange: (fecha: string) => void;
}

export function MiniCalendario({ value, minFecha, onChange }: MiniCalendarioProps) {
  const [mesVisible, setMesVisible] = useState(inicioMes(value));

  const dias = grillaMes(mesVisible);
  const puedeRetroceder = inicioMes(mesAnterior(mesVisible)) >= inicioMes(minFecha);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => setMesVisible((m) => mesAnterior(m))}
          disabled={!puedeRetroceder}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          aria-label="Mes anterior"
        >
          ‹
        </motion.button>
        <AnimatePresence mode="wait">
          <motion.span
            key={mesVisible}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-medium text-gray-900"
          >
            {nombreMes(mesVisible)}
          </motion.span>
        </AnimatePresence>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => setMesVisible((m) => mesSiguiente(m))}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Mes siguiente"
        >
          ›
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {DIAS_CORTOS.map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia) => {
          const deshabilitado = dia.fecha < minFecha;
          const elegido = dia.fecha === value;
          return (
            <motion.button
              key={dia.fecha}
              type="button"
              whileTap={deshabilitado ? undefined : { scale: 0.88 }}
              disabled={deshabilitado}
              onClick={() => onChange(dia.fecha)}
              className={`rounded-lg py-1.5 text-sm ${
                elegido
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                  : deshabilitado
                    ? "text-gray-300"
                    : !dia.delMesActual
                      ? "text-gray-300 hover:bg-gray-50"
                      : "text-gray-700 hover:bg-violet-50"
              }`}
            >
              {dia.diaMes}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
