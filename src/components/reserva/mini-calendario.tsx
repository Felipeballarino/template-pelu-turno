"use client";

import { useState } from "react";
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
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMesVisible((m) => mesAnterior(m))}
          disabled={!puedeRetroceder}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-gray-900">{nombreMes(mesVisible)}</span>
        <button
          type="button"
          onClick={() => setMesVisible((m) => mesSiguiente(m))}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Mes siguiente"
        >
          ›
        </button>
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
            <button
              key={dia.fecha}
              type="button"
              disabled={deshabilitado}
              onClick={() => onChange(dia.fecha)}
              className={`rounded-md py-1.5 text-sm ${
                elegido
                  ? "bg-gray-900 text-white"
                  : deshabilitado
                    ? "text-gray-300"
                    : !dia.delMesActual
                      ? "text-gray-300 hover:bg-gray-50"
                      : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {dia.diaMes}
            </button>
          );
        })}
      </div>
    </div>
  );
}
