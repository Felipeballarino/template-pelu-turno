"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { formatearFechaLarga, formatearHora, hoyArgentina } from "@/lib/date";
import { obtenerHorariosDisponibles, type SlotDisponible } from "@/lib/reserva/actions";
import { construirLinkWhatsApp, construirMensajeReprogramacion } from "@/lib/whatsapp";
import type { Peluquero, Servicio } from "@/types/database";
import {
  indiceServiciosPorPeluquero,
  peluqueroOfreceServicio,
  type AsignacionServicio,
} from "@/lib/reserva/servicios-peluquero";
import { actualizarTurno } from "./actions";

interface EditarTurnoFormProps {
  turnoId: string;
  nombreCliente: string;
  servicios: Servicio[];
  peluqueros: Peluquero[];
  asignaciones: AsignacionServicio[];
  servicioIdInicial: string;
  peluqueroIdInicial: string;
  fechaInicial: string;
  horaInicioInicial: string;
  onCancelar: () => void;
  onGuardado: () => void;
}

/** Formulario de edición de un turno existente, embebido en su tarjeta. */
export function EditarTurnoForm({
  turnoId,
  nombreCliente,
  servicios,
  peluqueros,
  asignaciones,
  servicioIdInicial,
  peluqueroIdInicial,
  fechaInicial,
  horaInicioInicial,
  onCancelar,
  onGuardado,
}: EditarTurnoFormProps) {
  const [servicioId, setServicioId] = useState(servicioIdInicial);
  const [peluqueroId, setPeluqueroId] = useState(peluqueroIdInicial);
  const [fecha, setFecha] = useState(fechaInicial);
  const indiceServicios = indiceServiciosPorPeluquero(asignaciones);
  const peluquerosQueOfrecen = servicioId
    ? peluqueros.filter((p) => peluqueroOfreceServicio(indiceServicios, p.id, servicioId))
    : peluqueros;
  const [slots, setSlots] = useState<SlotDisponible[] | null>(null);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [horaElegida, setHoraElegida] = useState<string | null>(formatearHora(horaInicioInicial));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const primerRender = useRef(true);

  const servicio = servicios.find((s) => s.id === servicioId);

  useEffect(() => {
    if (servicioId && peluqueroId && !peluqueroOfreceServicio(indiceServicios, peluqueroId, servicioId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeluqueroId(peluquerosQueOfrecen[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId]);

  useEffect(() => {
    if (!servicio || !peluqueroId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlots(null);
      return;
    }
    // Al cambiar servicio/peluquero/fecha después del primer render, la hora
    // elegida deja de ser válida (era relativa a la combinación anterior).
    if (!primerRender.current) {
      setHoraElegida(null);
    }
    primerRender.current = false;

    let cancelado = false;
    setCargandoSlots(true);
    obtenerHorariosDisponibles({
      peluqueroId,
      servicioId: servicio.id,
      fecha,
      duracionMinutos: servicio.duracion_minutos,
      excluirTurnoId: turnoId,
    })
      .then((resultado) => {
        if (!cancelado) setSlots(resultado);
      })
      .finally(() => {
        if (!cancelado) setCargandoSlots(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId, peluqueroId, fecha]);

  async function guardar() {
    if (!servicio || !peluqueroId || !horaElegida) return;
    setEnviando(true);
    setError(null);
    try {
      const resultado = await actualizarTurno(turnoId, {
        servicioId: servicio.id,
        peluqueroId,
        fecha,
        horaInicio: horaElegida,
      });
      if (!resultado.ok || !resultado.info) {
        setError(resultado.error ?? "No se pudo guardar el turno.");
        return;
      }
      const cambioHorarioOPeluquero =
        fecha !== fechaInicial || horaElegida !== formatearHora(horaInicioInicial) || peluqueroId !== peluqueroIdInicial;
      if (cambioHorarioOPeluquero) {
        const mensaje = construirMensajeReprogramacion({
          nombreCliente,
          servicioNombre: resultado.info.servicioNombre,
          fecha: resultado.info.fecha,
          horaInicio: resultado.info.horaInicio,
        });
        window.open(
          construirLinkWhatsApp(resultado.info.telefonoCliente, mensaje),
          "_blank",
          "noopener,noreferrer"
        );
      }
      onGuardado();
    } catch {
      setError("No se pudo guardar el turno. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const puedeGuardar = Boolean(servicio) && Boolean(peluqueroId) && Boolean(horaElegida);

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Editar turno de {nombreCliente}</h3>
        <button
          type="button"
          onClick={onCancelar}
          className="flex items-center gap-1 rounded-md p-1 text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-700"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
          Cancelar
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Servicio</label>
          <select
            value={servicioId}
            onChange={(e) => setServicioId(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
          >
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.duracion_minutos} min)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Peluquero</label>
          <select
            value={peluqueroId}
            onChange={(e) => setPeluqueroId(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
          >
            {peluquerosQueOfrecen.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Fecha</label>
          <input
            type="date"
            min={hoyArgentina()}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 capitalize">{formatearFechaLarga(fecha)}</p>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Horario</label>
        {cargandoSlots && <p className="text-sm text-gray-400">Buscando horarios libres...</p>}
        {!cargandoSlots && slots && slots.length === 0 && (
          <p className="text-sm text-gray-400">No hay horarios libres ese día para ese servicio.</p>
        )}
        {!cargandoSlots && slots && slots.length > 0 && (
          <div className="grid grid-cols-6 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.hora}
                type="button"
                onClick={() => setHoraElegida(slot.hora)}
                className={`rounded-md border px-2 py-1.5 text-sm ${
                  horaElegida === slot.hora
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                {slot.hora}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={!puedeGuardar || enviando}
        onClick={guardar}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
      >
        <Check className="h-4 w-4" strokeWidth={2} />
        {enviando ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
