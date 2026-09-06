"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatearFechaLarga, formatearHora, hoyArgentina } from "@/lib/date";
import { construirLinkWhatsApp, construirMensajeAvisoPeluqueroReprogramacion } from "@/lib/whatsapp";
import { cancelarTurnoCliente } from "@/lib/reserva/cancelacion-cliente";
import { EditarHorarioTurno } from "@/components/reserva/editar-horario-turno";
import type { TurnoParaCancelar } from "@/lib/reserva/cancelacion-cliente";

function construirMensajeAvisoPeluquero(turno: TurnoParaCancelar): string {
  return `Hola ${turno.peluqueroNombre}! Soy ${turno.nombreCliente}, te aviso que cancelé mi turno de ${turno.servicioNombre} del ${formatearFechaLarga(turno.fecha)} a las ${formatearHora(turno.horaInicio)}hs.`;
}

export function CancelarTurnoView({ turno: turnoInicial }: { turno: TurnoParaCancelar | null }) {
  const [turno, setTurno] = useState(turnoInicial);
  const [editandoHorario, setEditandoHorario] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelado, setCancelado] = useState(turno?.estado === "cancelado");
  const [reprogramado, setReprogramado] = useState(false);

  if (!turno) {
    return (
      <Layout titulo="Turno no encontrado">
        <p className="text-sm text-gray-500">
          No encontramos ese turno. Puede que el link esté mal copiado o que el turno ya no
          exista.
        </p>
      </Layout>
    );
  }

  const yaPaso = turno.fecha < hoyArgentina();

  if (cancelado) {
    return (
      <Layout titulo="Turno cancelado">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-500"
        >
          ✓
        </motion.div>
        <p className="mt-3 text-sm text-gray-500">
          Tu turno de {turno.servicioNombre} con {turno.peluqueroNombre} del{" "}
          {formatearFechaLarga(turno.fecha)} a las {formatearHora(turno.horaInicio)}hs quedó
          cancelado.
        </p>
        {turno.peluqueroWhatsapp && (
          <a
            href={construirLinkWhatsApp(turno.peluqueroWhatsapp, construirMensajeAvisoPeluquero(turno))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-green-100 hover:bg-green-700"
          >
            Avisar por WhatsApp
          </a>
        )}
      </Layout>
    );
  }

  if (editandoHorario) {
    return (
      <Layout titulo="Cambiar horario">
        <EditarHorarioTurno
          turno={turno}
          onCancelar={() => setEditandoHorario(false)}
          onGuardado={(nuevaFecha, nuevaHora, nuevaHoraFin) => {
            if (turno.peluqueroWhatsapp) {
              const mensaje = construirMensajeAvisoPeluqueroReprogramacion({
                peluqueroNombre: turno.peluqueroNombre,
                nombreCliente: turno.nombreCliente,
                servicioNombre: turno.servicioNombre,
                fechaAnterior: turno.fecha,
                horaInicioAnterior: turno.horaInicio,
                fechaNueva: nuevaFecha,
                horaInicioNueva: nuevaHora,
              });
              window.open(
                construirLinkWhatsApp(turno.peluqueroWhatsapp, mensaje),
                "_blank",
                "noopener,noreferrer"
              );
            }
            setTurno({
              ...turno,
              fecha: nuevaFecha,
              horaInicio: nuevaHora,
              horaFin: nuevaHoraFin,
            });
            setEditandoHorario(false);
            setReprogramado(true);
          }}
        />
      </Layout>
    );
  }

  return (
    <Layout titulo="Tu turno">
      <div className="space-y-2 rounded-2xl border border-gray-200 bg-violet-50 px-4 py-3 text-sm text-gray-700 shadow-sm">
        <p>
          <span className="text-gray-500">Servicio: </span>
          {turno.servicioNombre}
        </p>
        <p>
          <span className="text-gray-500">Peluquero: </span>
          {turno.peluqueroNombre}
        </p>
        <p>
          <span className="text-gray-500">Día: </span>
          {formatearFechaLarga(turno.fecha)}
        </p>
        <p>
          <span className="text-gray-500">Horario: </span>
          {formatearHora(turno.horaInicio)}–{formatearHora(turno.horaFin)}hs
        </p>
      </div>

      {reprogramado && (
        <p className="mt-3 text-sm text-emerald-600">Tu turno quedó reprogramado con éxito.</p>
      )}

      {yaPaso ? (
        <p className="mt-4 text-sm text-gray-400">Este turno ya pasó.</p>
      ) : (
        <>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditandoHorario(true)}
            className="mt-4 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 hover:bg-violet-100"
          >
            Cambiar día u horario
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={cancelando}
            onClick={async () => {
              if (!confirm("¿Seguro que querés cancelar este turno?")) return;
              setCancelando(true);
              setError(null);
              const resultado = await cancelarTurnoCliente(turno.id);
              if (!resultado.ok) {
                setError(resultado.error ?? "No se pudo cancelar el turno.");
                setCancelando(false);
                return;
              }
              if (turno.peluqueroWhatsapp) {
                window.open(
                  construirLinkWhatsApp(turno.peluqueroWhatsapp, construirMensajeAvisoPeluquero(turno)),
                  "_blank",
                  "noopener,noreferrer"
                );
              }
              setCancelado(true);
              setCancelando(false);
            }}
            className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {cancelando ? "Cancelando..." : "Cancelar mi turno"}
          </motion.button>
        </>
      )}
    </Layout>
  );
}

function Layout({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-lg space-y-4 px-4 py-8 text-center"
    >
      <h1 className="text-xl font-semibold text-gray-900">{titulo}</h1>
      <div className="text-left">{children}</div>
      <Link
        href="/"
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Volver al inicio
      </Link>
    </motion.div>
  );
}
