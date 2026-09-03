"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatearFechaLarga, hoyArgentina } from "@/lib/date";
import {
  crearTurnoPublico,
  obtenerHorariosDisponibles,
  type SlotDisponible,
} from "@/lib/reserva/actions";
import type { Peluquero, Servicio } from "@/types/database";
import {
  indiceServiciosPorPeluquero,
  peluqueroOfreceServicio,
  type AsignacionServicio,
} from "@/lib/reserva/servicios-peluquero";

interface NuevoTurnoFormProps {
  servicios: Servicio[];
  peluqueros: Peluquero[];
  asignaciones: AsignacionServicio[];
  fechaInicial: string;
  peluqueroIdInicial: string;
}

/**
 * Carga manual de un turno desde el panel — típicamente para cuando un
 * cliente responde el aviso de cancelación pidiendo otro horario y el
 * peluquero se lo agenda directamente, sin que el cliente tenga que volver
 * a pasar por la reserva pública. Reutiliza la misma lógica de horarios
 * libres y de creación que usa esa pantalla pública.
 */
export function NuevoTurnoForm({
  servicios,
  peluqueros,
  asignaciones,
  fechaInicial,
  peluqueroIdInicial,
}: NuevoTurnoFormProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? "");
  const [peluqueroId, setPeluqueroId] = useState(peluqueroIdInicial || peluqueros[0]?.id || "");
  const [fecha, setFecha] = useState(fechaInicial);
  const indiceServicios = indiceServiciosPorPeluquero(asignaciones);
  const peluquerosQueOfrecen = servicioId
    ? peluqueros.filter((p) => peluqueroOfreceServicio(indiceServicios, p.id, servicioId))
    : peluqueros;
  const [slots, setSlots] = useState<SlotDisponible[] | null>(null);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [horaElegida, setHoraElegida] = useState<string | null>(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const servicio = servicios.find((s) => s.id === servicioId);

  // Si el peluquero elegido no ofrece el nuevo servicio, se cae al primero
  // que sí lo ofrece, en vez de dejar una combinación inválida.
  useEffect(() => {
    if (servicioId && peluqueroId && !peluqueroOfreceServicio(indiceServicios, peluqueroId, servicioId)) {
      setPeluqueroId(peluquerosQueOfrecen[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId]);

  useEffect(() => {
    if (!abierto || !servicio || !peluqueroId) {
      setSlots(null);
      return;
    }
    setHoraElegida(null);
    let cancelado = false;
    setCargandoSlots(true);
    obtenerHorariosDisponibles({
      peluqueroId,
      servicioId: servicio.id,
      fecha,
      duracionMinutos: servicio.duracion_minutos,
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
  }, [abierto, servicioId, peluqueroId, fecha]);

  function resetear() {
    setAbierto(false);
    setHoraElegida(null);
    setNombreCliente("");
    setTelefonoCliente("");
    setError(null);
  }

  async function confirmar() {
    if (!servicio || !peluqueroId || !horaElegida || !nombreCliente.trim() || !telefonoCliente.trim()) {
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const resultado = await crearTurnoPublico({
        servicioId: servicio.id,
        peluqueroId,
        fecha,
        horaInicio: horaElegida,
        nombreCliente,
        telefonoCliente,
      });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo cargar el turno.");
        return;
      }
      resetear();
      router.refresh();
    } catch {
      setError("No se pudo cargar el turno. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Nuevo turno
      </button>
    );
  }

  const puedeConfirmar =
    Boolean(servicio) &&
    Boolean(peluqueroId) &&
    Boolean(horaElegida) &&
    nombreCliente.trim().length > 0 &&
    telefonoCliente.trim().length > 0;

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Cargar turno manualmente</h3>
        <button type="button" onClick={resetear} className="text-xs text-gray-400 hover:text-gray-700">
          Cancelar
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Servicio</label>
          <select
            value={servicioId}
            onChange={(e) => setServicioId(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">{formatearFechaLarga(fecha)}</p>

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
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {slot.hora}
              </button>
            ))}
          </div>
        )}
      </div>

      {horaElegida && (
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Teléfono del cliente"
            value={telefonoCliente}
            onChange={(e) => setTelefonoCliente(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {horaElegida && (
        <button
          type="button"
          disabled={!puedeConfirmar || enviando}
          onClick={confirmar}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Guardar turno"}
        </button>
      )}
    </div>
  );
}
