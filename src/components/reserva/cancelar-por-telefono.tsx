"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatearFechaLarga, formatearHora } from "@/lib/date";
import { construirLinkWhatsApp, construirMensajeAvisoPeluqueroReprogramacion } from "@/lib/whatsapp";
import {
  buscarTurnosPorTelefono,
  cancelarTurnoCliente,
  type TurnoBusqueda,
} from "@/lib/reserva/cancelacion-cliente";
import { EditarHorarioTurno } from "./editar-horario-turno";

function construirMensajeAvisoPeluquero(turno: TurnoBusqueda): string {
  return `Hola ${turno.peluqueroNombre}! Cancelé mi turno de ${turno.servicioNombre} del ${formatearFechaLarga(turno.fecha)} a las ${formatearHora(turno.horaInicio)}hs.`;
}

export function CancelarPorTelefono({ onVolver }: { onVolver: () => void }) {
  const [telefono, setTelefono] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [turnos, setTurnos] = useState<TurnoBusqueda[]>([]);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [canceladosIds, setCanceladosIds] = useState<string[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buscar() {
    if (!telefono.trim()) return;
    setBuscando(true);
    setError(null);
    try {
      const resultado = await buscarTurnosPorTelefono(telefono);
      setTurnos(resultado);
      setBuscado(true);
    } catch {
      setError("No se pudo buscar. Revisá tu conexión y probá de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  async function cancelar(turno: TurnoBusqueda) {
    if (!confirm(`¿Cancelar tu turno de ${turno.servicioNombre} del ${formatearFechaLarga(turno.fecha)}?`))
      return;
    setCancelandoId(turno.id);
    setError(null);
    const resultado = await cancelarTurnoCliente(turno.id);
    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo cancelar el turno.");
      setCancelandoId(null);
      return;
    }
    if (turno.peluqueroWhatsapp) {
      window.open(
        construirLinkWhatsApp(turno.peluqueroWhatsapp, construirMensajeAvisoPeluquero(turno)),
        "_blank",
        "noopener,noreferrer"
      );
    }
    setCanceladosIds((actual) => [...actual, turno.id]);
    setCancelandoId(null);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onVolver}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50"
          aria-label="Volver"
        >
          ‹
        </motion.button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mi turno</h1>
          <p className="text-sm text-gray-500">Buscá con el teléfono que usaste al reservar.</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex gap-2">
          <div className="flex flex-1 overflow-hidden rounded-xl border border-gray-300 focus-within:border-violet-400">
            <span className="flex items-center bg-gray-50 px-2 text-sm text-gray-500">+549</span>
            <input
              type="tel"
              placeholder="3534196213"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
            />
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={buscando || !telefono.trim()}
            onClick={buscar}
            className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </motion.button>
        </div>
        <p className="text-xs text-gray-400">Código de área + número, sin 0 ni 15.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {buscado && turnos.length === 0 && (
        <p className="text-sm text-gray-400">
          No encontramos turnos activos con ese teléfono. Revisá que esté bien escrito.
        </p>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {turnos.map((t, i) => {
            const cancelado = canceladosIds.includes(t.id);

            if (!cancelado && editandoId === t.id) {
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <EditarHorarioTurno
                    turno={t}
                    onCancelar={() => setEditandoId(null)}
                    onGuardado={(nuevaFecha, nuevaHora, nuevaHoraFin) => {
                      if (t.peluqueroWhatsapp) {
                        const mensaje = construirMensajeAvisoPeluqueroReprogramacion({
                          peluqueroNombre: t.peluqueroNombre,
                          nombreCliente: t.nombreCliente,
                          servicioNombre: t.servicioNombre,
                          fechaAnterior: t.fecha,
                          horaInicioAnterior: t.horaInicio,
                          fechaNueva: nuevaFecha,
                          horaInicioNueva: nuevaHora,
                        });
                        window.open(
                          construirLinkWhatsApp(t.peluqueroWhatsapp, mensaje),
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                      setTurnos((actual) =>
                        actual.map((x) =>
                          x.id === t.id
                            ? { ...x, fecha: nuevaFecha, horaInicio: nuevaHora, horaFin: nuevaHoraFin }
                            : x
                        )
                      );
                      setEditandoId(null);
                    }}
                  />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.servicioNombre}</p>
                  <p className="text-xs text-gray-500">
                    {t.peluqueroNombre} · {formatearFechaLarga(t.fecha)} a las{" "}
                    {formatearHora(t.horaInicio)}hs
                  </p>
                </div>
                {cancelado ? (
                  <span className="shrink-0 text-xs font-medium text-gray-400">Cancelado ✓</span>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setEditandoId(t.id)}
                      className="rounded-full border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
                    >
                      Cambiar horario
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      disabled={cancelandoId === t.id}
                      onClick={() => cancelar(t)}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancelandoId === t.id ? "Cancelando..." : "Cancelar"}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
