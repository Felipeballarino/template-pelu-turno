"use client";

import { useState, useTransition } from "react";
import { Clock, Plus, Minus } from "lucide-react";
import { formatearHora } from "@/lib/date";
import {
  actualizarHorarioLaboral,
  crearHorarioLaboral,
  eliminarHorarioLaboral,
  eliminarHorariosLaborales,
} from "./actions";

export interface Franja {
  id: string;
  hora_inicio: string;
  hora_fin: string;
}

const DEFAULT_INICIO = "09:00";
const DEFAULT_FIN = "18:00";

/** Suma una hora a "HH:MM" (o "HH:MM:SS"), sin pasar de las 23:00. */
function sumarUnaHora(horaHHMM: string): string {
  const [h] = horaHHMM.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:00`;
}

function franjaFormData(peluqueroId: string, dia: number, horaInicio: string, horaFin: string) {
  const fd = new FormData();
  fd.set("peluquero_id", peluqueroId);
  fd.append("dias_semana", String(dia));
  fd.set("hora_inicio", horaInicio);
  fd.set("hora_fin", horaFin);
  return fd;
}

function FranjaRow({
  franja,
  esUnica,
  onQuitar,
}: {
  franja: Franja;
  esUnica: boolean;
  onQuitar: (id: string) => void;
}) {
  const [horaInicio, setHoraInicio] = useState(formatearHora(franja.hora_inicio));
  const [horaFin, setHoraFin] = useState(formatearHora(franja.hora_fin));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar(nuevoInicio: string, nuevoFin: string) {
    setError(null);
    startTransition(async () => {
      try {
        await actualizarHorarioLaboral(franja.id, nuevoInicio, nuevoFin);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100">
        <Clock className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.8} />
        <input
          type="time"
          value={horaInicio}
          disabled={pending}
          onChange={(e) => setHoraInicio(e.target.value)}
          onBlur={() => guardar(horaInicio, horaFin)}
          className="w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none"
        />
      </label>
      <span className="shrink-0 text-sm text-gray-400">a</span>
      <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100">
        <Clock className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.8} />
        <input
          type="time"
          value={horaFin}
          disabled={pending}
          onChange={(e) => setHoraFin(e.target.value)}
          onBlur={() => guardar(horaInicio, horaFin)}
          className="w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none"
        />
      </label>
      <button
        type="button"
        title={esUnica ? "Quitar este día" : "Quitar este horario"}
        onClick={() => onQuitar(franja.id)}
        className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <Minus className="h-4 w-4" strokeWidth={1.8} />
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function DiaHorario({
  peluqueroId,
  diaIndex,
  nombreDia,
  franjas,
}: {
  peluqueroId: string;
  diaIndex: number;
  nombreDia: string;
  franjas: Franja[];
}) {
  const [pending, startTransition] = useTransition();
  const activo = franjas.length > 0;

  function toggleActivo(marcado: boolean) {
    startTransition(async () => {
      if (marcado) {
        await crearHorarioLaboral(
          franjaFormData(peluqueroId, diaIndex, DEFAULT_INICIO, DEFAULT_FIN)
        );
      } else {
        await eliminarHorariosLaborales(franjas.map((f) => f.id));
      }
    });
  }

  function agregarFranja() {
    const ultima = franjas[franjas.length - 1];
    const inicio = ultima ? sumarUnaHora(formatearHora(ultima.hora_fin)) : DEFAULT_INICIO;
    const fin = sumarUnaHora(inicio);
    startTransition(async () => {
      await crearHorarioLaboral(franjaFormData(peluqueroId, diaIndex, inicio, fin));
    });
  }

  function quitarFranja(id: string) {
    startTransition(async () => {
      await eliminarHorarioLaboral(id);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
        <input
          type="checkbox"
          checked={activo}
          disabled={pending}
          onChange={(e) => toggleActivo(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400"
        />
        {nombreDia}
      </label>

      {activo && (
        <div className="mt-3 space-y-2 pl-6">
          {franjas.map((f) => (
            <FranjaRow key={f.id} franja={f} esUnica={franjas.length === 1} onQuitar={quitarFranja} />
          ))}
          <button
            type="button"
            onClick={agregarFranja}
            disabled={pending}
            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Agregar horario
          </button>
        </div>
      )}
    </div>
  );
}
