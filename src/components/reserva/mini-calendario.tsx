"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { grillaMes, inicioMes, mesAnterior, mesSiguiente, nombreMes } from "@/lib/semana";
import { obtenerDiasDisponibles } from "@/lib/reserva/actions";

const DIAS_CORTOS = ["L", "M", "M", "J", "V", "S", "D"];

interface MiniCalendarioProps {
  value: string; // YYYY-MM-DD
  minFecha: string; // YYYY-MM-DD, días anteriores quedan deshabilitados
  onChange: (fecha: string) => void;
  /**
   * Si se pasan servicioId y duracionMinutos, además se deshabilitan los
   * días en que nadie trabaja o ya no queda capacidad para esa combinación
   * (peluqueroId "" = cualquiera disponible, igual que en el resto de la
   * reserva).
   */
  peluqueroId?: string;
  servicioId?: string;
  duracionMinutos?: number;
}

export function MiniCalendario({
  value,
  minFecha,
  onChange,
  peluqueroId,
  servicioId,
  duracionMinutos,
}: MiniCalendarioProps) {
  const [mesVisible, setMesVisible] = useState(inicioMes(value));
  const [diasDisponibles, setDiasDisponibles] = useState<Set<string> | null>(null);

  const dias = grillaMes(mesVisible);
  const puedeRetroceder = inicioMes(mesAnterior(mesVisible)) >= inicioMes(minFecha);

  // Se recalcula cada vez que cambia el mes visible o la combinación de
  // servicio/peluquero. Si todavía no hay servicio elegido, no se
  // deshabilita nada por capacidad (solo rige el mínimo de fecha).
  useEffect(() => {
    if (!servicioId || !duracionMinutos) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiasDisponibles(null);
      return;
    }
    let cancelado = false;
    obtenerDiasDisponibles({
      peluqueroId: peluqueroId ?? "",
      servicioId,
      duracionMinutos,
      desde: dias[0].fecha,
      hasta: dias[dias.length - 1].fecha,
    }).then((resultado) => {
      if (!cancelado) setDiasDisponibles(new Set(resultado));
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesVisible, peluqueroId, servicioId, duracionMinutos]);

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
          const sinCapacidad = diasDisponibles !== null && !diasDisponibles.has(dia.fecha);
          const deshabilitado = dia.fecha < minFecha || sinCapacidad;
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
