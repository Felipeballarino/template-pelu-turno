"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { formatearFechaLarga, hoyArgentina } from "@/lib/date";
import {
  crearTurnoPublico,
  obtenerHorariosDisponibles,
  type SlotDisponible,
} from "@/lib/reserva/actions";
import { crearPreferenciaMercadoPago } from "@/lib/reserva/mercadopago-actions";
import type { Peluquero, Servicio } from "@/types/database";
import {
  indiceServiciosPorPeluquero,
  peluqueroOfreceServicio,
  type AsignacionServicio,
} from "@/lib/reserva/servicios-peluquero";
import { MiniCalendario } from "./mini-calendario";

const OPCION_CUALQUIERA = "";

const PASOS = ["Servicio", "Peluquero", "Día y horario", "Tus datos"] as const;
type Paso = 1 | 2 | 3 | 4;

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

// Colores para los avatares de iniciales de cada peluquero (se ciclan por
// orden, así cada uno se ve distinto sin necesidad de guardar una
// preferencia de color por peluquero en la base).
const PALETA_AVATARES = [
  "linear-gradient(145deg, #7dd3fc, #2563eb)",
  "linear-gradient(145deg, #fde68a, #f97316)",
  "linear-gradient(145deg, #fecdd3, #e11d48)",
  "linear-gradient(145deg, #6ee7b7, #059669)",
  "linear-gradient(145deg, #c4b5fd, #7c3aed)",
];

function IconoTijeras() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} className="h-6 w-6">
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" />
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" />
      <path d="M8 7.5L20 19M8 16.5L20 5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function construirMensajeWhatsApp(turno: TurnoConfirmado): string {
  return `Hola ${turno.peluqueroNombre}! Soy ${turno.nombreCliente}, reservé un turno para ${turno.servicioNombre} el ${formatearFechaLarga(turno.fecha)} a las ${turno.horaInicio.slice(0, 5)}hs. Pago en efectivo en el local.`;
}

function construirLinkWhatsApp(turno: TurnoConfirmado): string {
  return `https://wa.me/${turno.peluqueroWhatsapp}?text=${encodeURIComponent(construirMensajeWhatsApp(turno))}`;
}

type TurnoConfirmado = NonNullable<Awaited<ReturnType<typeof crearTurnoPublico>>["turno"]>;

interface ReservaFormProps {
  servicios: Servicio[];
  peluqueros: Peluquero[];
  asignaciones: AsignacionServicio[];
  mercadoPagoHabilitado: boolean;
  onVolver?: () => void;
}

const MENSAJE_SIN_REEMBOLSO =
  "Si pagás con Mercado Pago y después cancelás o cancelan el turno, ese pago no se reembolsa.";

const transicionPaso = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.18, ease: "easeOut" as const },
};

export function ReservaForm({
  servicios,
  peluqueros,
  asignaciones,
  mercadoPagoHabilitado,
  onVolver,
}: ReservaFormProps) {
  const [paso, setPaso] = useState<Paso>(1);
  const [bannerPago, setBannerPago] = useState<"exitoso" | "fallido" | "pendiente" | null>(null);
  const [pagandoConMp, setPagandoConMp] = useState(false);
  const [servicioId, setServicioId] = useState("");
  const [peluqueroId, setPeluqueroId] = useState(OPCION_CUALQUIERA);
  const [fecha, setFecha] = useState(hoyArgentina());
  const indiceServicios = indiceServiciosPorPeluquero(asignaciones);
  const peluquerosQueOfrecen = servicioId
    ? peluqueros.filter((p) => peluqueroOfreceServicio(indiceServicios, p.id, servicioId))
    : [];
  const [slots, setSlots] = useState<SlotDisponible[] | null>(null);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [slotElegido, setSlotElegido] = useState<SlotDisponible | null>(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [reserva, setReserva] = useState<TurnoConfirmado | null>(null);

  const servicio = servicios.find((s) => s.id === servicioId);

  // Al volver de Mercado Pago (back_urls), se muestra un banner según el
  // resultado y se limpia el parámetro de la URL para que no reaparezca
  // si el cliente refresca la página. Necesita ser un efecto: solo puede
  // leerse window.location una vez montado en el cliente.
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const pago = parametros.get("pago");
    if (pago === "exitoso" || pago === "fallido" || pago === "pendiente") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBannerPago(pago);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Si el peluquero elegido no ofrece el nuevo servicio, se vuelve a
  // "cualquiera disponible" en vez de dejar una combinación inválida.
  useEffect(() => {
    if (
      servicioId &&
      peluqueroId &&
      !peluqueroOfreceServicio(indiceServicios, peluqueroId, servicioId)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeluqueroId(OPCION_CUALQUIERA);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId]);

  // Cada vez que cambia servicio, peluquero o fecha, se vuelven a pedir los
  // horarios libres. El horario elegido se descarta porque puede ya no ser
  // válido para la nueva combinación (se limpia acá mismo, junto con el
  // fetch que sigue, para no dejar seleccionado un horario que ya no aplica).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlotElegido(null);
    if (!servicio) {
      setSlots(null);
      return;
    }
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
  }, [servicioId, peluqueroId, fecha]);

  async function confirmar() {
    if (!servicio || !slotElegido || !nombreCliente.trim() || !telefonoCliente.trim()) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const resultado = await crearTurnoPublico({
        servicioId: servicio.id,
        peluqueroId: slotElegido.peluqueroId,
        fecha,
        horaInicio: slotElegido.hora,
        nombreCliente,
        telefonoCliente,
      });
      if (!resultado.ok || !resultado.turno) {
        setErrorEnvio(resultado.error ?? "No se pudo confirmar el turno.");
        // El horario pudo haberse ocupado justo ahora: refrescamos la lista
        // y volvemos al paso de horarios para que elija otro.
        setSlots(null);
        setSlotElegido(null);
        setPaso(3);
        setCargandoSlots(true);
        const actualizados = await obtenerHorariosDisponibles({
          peluqueroId,
          servicioId: servicio.id,
          fecha,
          duracionMinutos: servicio.duracion_minutos,
        });
        setSlots(actualizados);
        setCargandoSlots(false);
        return;
      }
      // El turno ya quedó reservado en la base pase lo que pase acá abajo:
      // el aviso por WhatsApp es una notificación best-effort al peluquero,
      // no una condición para que la reserva sea válida. Se intenta abrir
      // automáticamente en una pestaña nueva; si el navegador bloquea el
      // popup, el botón de la pantalla de confirmación queda como respaldo
      // para mandarlo manualmente.
      window.open(construirLinkWhatsApp(resultado.turno), "_blank", "noopener,noreferrer");
      setReserva(resultado.turno);
    } catch {
      setErrorEnvio("No se pudo confirmar el turno. Revisá tu conexión y probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  async function pagarConMercadoPago() {
    if (!servicio || !slotElegido || !nombreCliente.trim() || !telefonoCliente.trim()) return;
    if (!confirm(MENSAJE_SIN_REEMBOLSO + "\n\n¿Confirmás que querés pagar ahora?")) return;

    setPagandoConMp(true);
    setErrorEnvio(null);
    try {
      const resultado = await crearPreferenciaMercadoPago({
        servicioId: servicio.id,
        peluqueroId: slotElegido.peluqueroId,
        fecha,
        horaInicio: slotElegido.hora,
        nombreCliente,
        telefonoCliente,
      });
      if (!resultado.ok || !resultado.initPoint) {
        setErrorEnvio(resultado.error ?? "No se pudo iniciar el pago.");
        setPagandoConMp(false);
        return;
      }
      // Se navega en la misma pestaña (no una nueva) para que, al volver
      // con las back_urls, el cliente esté en esta misma página.
      window.location.href = resultado.initPoint;
    } catch {
      setErrorEnvio("No se pudo iniciar el pago. Revisá tu conexión y probá de nuevo.");
      setPagandoConMp(false);
    }
  }

  if (reserva) {
    return <ConfirmacionReserva turno={reserva} />;
  }

  const puedeConfirmar =
    Boolean(servicio) &&
    Boolean(slotElegido) &&
    nombreCliente.trim().length > 0 &&
    telefonoCliente.trim().length > 0;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reservar turno</h1>
        <p className="text-sm text-gray-500">Pagás en el local o ahora con Mercado Pago.</p>
      </div>

      {bannerPago === "exitoso" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          ¡Pago recibido! En unos minutos vas a tener tu turno confirmado. Si no te llega el aviso,
          contactá directamente a la peluquería.
        </div>
      )}
      {bannerPago === "pendiente" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Tu pago quedó pendiente de aprobación. En cuanto se acredite vas a tener tu turno
          confirmado.
        </div>
      )}
      {bannerPago === "fallido" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          El pago no se pudo completar y no se generó ningún turno. Podés intentar de nuevo o
          reservar pagando en el local.
        </div>
      )}

      {/* Progreso: volver + "Paso X de 4" */}
      <div className="flex items-center gap-3">
        {paso > 1 && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setPaso((p) => (p - 1) as Paso)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50"
            aria-label="Volver"
          >
            ‹
          </motion.button>
        )}
        {paso === 1 && onVolver && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onVolver}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50"
            aria-label="Volver"
          >
            ‹
          </motion.button>
        )}
        <div className="flex flex-1 items-center gap-1.5">
          {PASOS.map((nombre, i) => (
            <div key={nombre} className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className="h-full bg-violet-600"
                initial={false}
                animate={{ width: i + 1 <= paso ? "100%" : "0%" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>
        <span className="whitespace-nowrap text-xs text-gray-400">
          Paso {paso} de {PASOS.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Paso 1: Servicio */}
        {paso === 1 && (
          <motion.section key="paso-1" {...transicionPaso} className="space-y-2">
            <h2 className="text-sm font-medium text-gray-700">¿Qué servicio querés?</h2>
            <div className="grid grid-cols-2 gap-3">
              {servicios.map((s) => (
                <motion.button
                  key={s.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setServicioId(s.id);
                    setPaso(2);
                  }}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                    <IconoTijeras />
                  </span>
                  <span className="text-sm font-medium">{s.nombre}</span>
                  <span className="text-xs text-gray-400">{s.duracion_minutos} min</span>
                  <span className="text-sm font-semibold">{formatoPrecio.format(s.precio)}</span>
                </motion.button>
              ))}
              {servicios.length === 0 && (
                <p className="col-span-2 text-sm text-gray-400">
                  Todavía no hay servicios cargados.
                </p>
              )}
            </div>
          </motion.section>
        )}

        {/* Paso 2: Peluquero */}
        {paso === 2 && servicio && (
          <motion.section key="paso-2" {...transicionPaso} className="space-y-2">
            <h2 className="text-sm font-medium text-gray-700">¿Con quién?</h2>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setPeluqueroId(OPCION_CUALQUIERA);
                  setPaso(3);
                }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center shadow-sm transition hover:border-violet-300 hover:shadow-md"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg text-white shadow-md"
                  style={{ background: "linear-gradient(145deg, #a78bfa, #6d28d9)" }}
                >
                  ✨
                </span>
                <span className="text-sm font-medium">Cualquiera</span>
                <span className="text-xs text-gray-400">disponible</span>
              </motion.button>
              {peluquerosQueOfrecen.map((p, i) => {
                const iniciales = p.nombre
                  .split(" ")
                  .map((palabra) => palabra[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const gradiente = PALETA_AVATARES[i % PALETA_AVATARES.length];
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setPeluqueroId(p.id);
                      setPaso(3);
                    }}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center shadow-sm transition hover:border-violet-300 hover:shadow-md"
                  >
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white shadow-md"
                      style={{ background: gradiente }}
                    >
                      {iniciales}
                    </span>
                    <span className="text-sm font-medium">{p.nombre}</span>
                  </motion.button>
                );
              })}
            </div>
            {peluquerosQueOfrecen.length === 0 && (
              <p className="text-xs text-amber-600">
                Todavía no hay ningún peluquero para este servicio.
              </p>
            )}
          </motion.section>
        )}

        {/* Paso 3: Fecha + horarios */}
        {paso === 3 && servicio && (
          <motion.section key="paso-3" {...transicionPaso} className="space-y-2">
            <h2 className="text-sm font-medium text-gray-700">¿Qué día?</h2>
            <MiniCalendario value={fecha} minFecha={hoyArgentina()} onChange={setFecha} />

            <div className="pt-2">
              {cargandoSlots && (
                <p className="text-sm text-gray-400">Buscando horarios libres...</p>
              )}
              {!cargandoSlots && slots && slots.length === 0 && (
                <p className="text-sm text-gray-400">
                  No hay horarios libres ese día. Probá con otra fecha.
                </p>
              )}
              {!cargandoSlots && slots && slots.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <motion.button
                      key={`${slot.peluqueroId}-${slot.hora}`}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        setSlotElegido(slot);
                        setPaso(4);
                      }}
                      title={peluqueroId === OPCION_CUALQUIERA ? slot.peluqueroNombre : undefined}
                      className="rounded-xl border border-gray-300 bg-white px-2 py-1.5 text-sm hover:border-violet-300 hover:bg-violet-50"
                    >
                      {slot.hora}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Paso 4: Resumen + datos de contacto + confirmar */}
        {paso === 4 && servicio && slotElegido && (
          <motion.section key="paso-4" {...transicionPaso} className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 bg-violet-50 px-4 py-2.5">
                <h2 className="text-sm font-medium text-violet-700">Resumen</h2>
              </div>
              <div className="space-y-2.5 px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-500">Servicio</span>
                  <span className="text-right font-medium text-gray-900">
                    {servicio.nombre}
                    <span className="block text-xs font-normal text-gray-400">
                      {servicio.duracion_minutos} min
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Peluquero</span>
                  <span className="font-medium text-gray-900">{slotElegido.peluqueroNombre}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Día</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {formatearFechaLarga(fecha)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Horario</span>
                  <span className="font-medium text-gray-900">{slotElegido.hora}hs</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">Total</span>
                  <p className="text-xs text-gray-400">
                    {mercadoPagoHabilitado
                      ? "Pagás en el local o ahora con Mercado Pago"
                      : "Se paga en efectivo en el local"}
                  </p>
                </div>
                <span className="text-lg font-semibold text-violet-700">
                  {formatoPrecio.format(servicio.precio)}
                </span>
              </div>
            </div>

            <h2 className="text-sm font-medium text-gray-700">Tus datos</h2>
            <input
              type="text"
              placeholder="Nombre"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            />
            <div>
              <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-violet-400">
                <span className="flex items-center bg-gray-50 px-2 text-sm text-gray-500">
                  +549
                </span>
                <input
                  type="tel"
                  placeholder="3534196213"
                  value={telefonoCliente}
                  onChange={(e) => setTelefonoCliente(e.target.value)}
                  className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Código de área + número, sin 0 ni 15.</p>
            </div>

            {errorEnvio && <p className="text-sm text-red-600">{errorEnvio}</p>}

            <div className="space-y-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={!puedeConfirmar || enviando || pagandoConMp}
                onClick={confirmar}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-200 hover:bg-violet-700 disabled:opacity-50 disabled:shadow-none"
              >
                {enviando
                  ? "Confirmando..."
                  : `Reservar y pagar en el local · ${formatoPrecio.format(servicio.precio)}`}
              </motion.button>

              {mercadoPagoHabilitado && (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    disabled={!puedeConfirmar || enviando || pagandoConMp}
                    onClick={pagarConMercadoPago}
                    className="w-full rounded-xl border border-violet-600 bg-white px-4 py-3 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                  >
                    {pagandoConMp
                      ? "Redirigiendo a Mercado Pago..."
                      : `Pagar ahora con Mercado Pago · ${formatoPrecio.format(servicio.precio)}`}
                  </motion.button>
                  <p className="text-xs text-gray-400">{MENSAJE_SIN_REEMBOLSO}</p>
                </>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmacionReserva({ turno }: { turno: TurnoConfirmado }) {
  const linkWhatsApp = construirLinkWhatsApp(turno);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-lg space-y-6 px-4 py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-2xl text-violet-600"
      >
        ✓
      </motion.div>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">¡Turno reservado!</h1>
        <p className="mt-1 text-sm text-gray-500">
          {turno.servicioNombre} con {turno.peluqueroNombre}
          <br />
          {formatearFechaLarga(turno.fecha)} a las {turno.horaInicio.slice(0, 5)}hs
        </p>
        <p className="mt-2 text-sm text-gray-500">Se paga en efectivo en el local.</p>
      </div>

      <a
        href={linkWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-green-100 hover:bg-green-700"
      >
        Avisar por WhatsApp
      </a>
      <p className="text-xs text-gray-400">
        Ya intentamos abrirlo automáticamente. Si no se abrió, tocá el botón para avisarle a{" "}
        {turno.peluqueroNombre}.
      </p>

      <Link
        href="/"
        className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Volver al inicio
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
        ¿Necesitás cancelar más adelante? Guardá este link (hacé captura de pantalla o agregalo a
        favoritos):
        <br />
        <a href={`/cancelar/${turno.id}`} className="break-all text-violet-700 underline">
          /cancelar/{turno.id}
        </a>
      </div>
    </motion.div>
  );
}
