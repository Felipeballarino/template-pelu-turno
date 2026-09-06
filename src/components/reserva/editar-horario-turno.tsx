"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatearFechaLarga, hoyArgentina } from "@/lib/date";
import { editarTurnoCliente } from "@/lib/reserva/cancelacion-cliente";
import { obtenerHorariosDisponibles, type SlotDisponible } from "@/lib/reserva/actions";

export interface TurnoParaReprogramar {
  id: string;
  peluqueroId: string;
  servicioId: string;
  duracionMinutos: number;
  fecha: string;
}

/**
 * Selector de nuevo día/horario para un turno existente (mismo peluquero y
 * servicio). Se usa tanto desde el link de WhatsApp (/cancelar/[id]) como
 * desde "Cancelar o cambiar un turno" en la home, buscando por teléfono.
 */
export function EditarHorarioTurno({
  turno,
  onCancelar,
  onGuardado,
}: {
  turno: TurnoParaReprogramar;
  onCancelar: () => void;
  onGuardado: (nuevaFecha: string, nuevaHora: string, nuevaHoraFin: string) => void;
}) {
  const [fecha, setFecha] = useState(turno.fecha);
  const [slots, setSlots] = useState<SlotDisponible[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [horaElegida, setHoraElegida] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);
    setHoraElegida(null);
    obtenerHorariosDisponibles({
      peluqueroId: turno.peluqueroId,
      servicioId: turno.servicioId,
      fecha,
      duracionMinutos: turno.duracionMinutos,
      excluirTurnoId: turno.id,
    })
      .then((resultado) => {
        if (!cancelado) setSlots(resultado);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [fecha, turno.id, turno.peluqueroId, turno.servicioId, turno.duracionMinutos]);

  async function confirmar() {
    if (!horaElegida) return;
    setEnviando(true);
    setError(null);
    const resultado = await editarTurnoCliente(turno.id, fecha, horaElegida);
    if (!resultado.ok || !resultado.horaFin) {
      setError(resultado.error ?? "No se pudo reprogramar el turno.");
      setEnviando(false);
      return;
    }
    onGuardado(fecha, horaElegida, resultado.horaFin);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Elegí un nuevo horario</h2>
        <button type="button" onClick={onCancelar} className="text-xs text-gray-400 hover:text-gray-700">
          Volver
        </button>
      </div>

      <input
        type="date"
        min={hoyArgentina()}
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <p className="text-xs text-gray-400 capitalize">{formatearFechaLarga(fecha)}</p>

      {cargando && <p className="text-sm text-gray-400">Buscando horarios libres...</p>}
      {!cargando && slots && slots.length === 0 && (
        <p className="text-sm text-gray-400">No hay horarios libres ese día.</p>
      )}
      {!cargando && slots && slots.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.hora}
              type="button"
              onClick={() => setHoraElegida(slot.hora)}
              className={`rounded-md border px-2 py-1.5 text-sm ${
                horaElegida === slot.hora
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {slot.hora}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        disabled={!horaElegida || enviando}
        onClick={confirmar}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {enviando ? "Guardando..." : "Confirmar nuevo horario"}
      </motion.button>
    </div>
  );
}
