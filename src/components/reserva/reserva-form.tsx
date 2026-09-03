"use client";

import { useEffect, useState } from "react";
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
import { MiniCalendario } from "./mini-calendario";

const OPCION_CUALQUIERA = "";

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

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
}

export function ReservaForm({ servicios, peluqueros, asignaciones }: ReservaFormProps) {
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

  // Si el peluquero elegido no ofrece el nuevo servicio, se vuelve a
  // "cualquiera disponible" en vez de dejar una combinación inválida.
  useEffect(() => {
    if (
      servicioId &&
      peluqueroId &&
      !peluqueroOfreceServicio(indiceServicios, peluqueroId, servicioId)
    ) {
      setPeluqueroId(OPCION_CUALQUIERA);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId]);

  // Cada vez que cambia servicio, peluquero o fecha, se vuelven a pedir los
  // horarios libres. El horario elegido se descarta porque puede ya no ser
  // válido para la nueva combinación.
  useEffect(() => {
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
        // El horario pudo haberse ocupado justo ahora: refrescamos la lista.
        setSlots(null);
        setSlotElegido(null);
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

  if (reserva) {
    return <ConfirmacionReserva turno={reserva} />;
  }

  const puedeConfirmar =
    Boolean(servicio) &&
    Boolean(slotElegido) &&
    nombreCliente.trim().length > 0 &&
    telefonoCliente.trim().length > 0;

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reservar turno</h1>
        <p className="text-sm text-gray-500">Pago en el local, no hace falta pagar ahora.</p>
      </div>

      {/* 1. Servicio */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">1. Elegí el servicio</h2>
        <div className="grid grid-cols-2 gap-3">
          {servicios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServicioId(s.id)}
              className={`flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left transition ${
                servicioId === s.id
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  servicioId === s.id ? "bg-white/15" : "bg-gray-100"
                }`}
              >
                <IconoTijeras />
              </span>
              <span className="text-sm font-medium">{s.nombre}</span>
              <span className={`text-xs ${servicioId === s.id ? "text-gray-300" : "text-gray-400"}`}>
                {s.duracion_minutos} min
              </span>
              <span className="text-sm font-semibold">{formatoPrecio.format(s.precio)}</span>
            </button>
          ))}
          {servicios.length === 0 && (
            <p className="col-span-2 text-sm text-gray-400">Todavía no hay servicios cargados.</p>
          )}
        </div>
      </section>

      {/* 2. Peluquero */}
      {servicio && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">2. ¿Con quién?</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPeluqueroId(OPCION_CUALQUIERA)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                peluqueroId === OPCION_CUALQUIERA
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Cualquiera disponible
            </button>
            {peluquerosQueOfrecen.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeluqueroId(p.id)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  peluqueroId === p.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.nombre}
              </button>
            ))}
          </div>
          {peluquerosQueOfrecen.length === 0 && (
            <p className="text-xs text-amber-600">
              Todavía no hay ningún peluquero para este servicio.
            </p>
          )}
        </section>
      )}

      {/* 3. Fecha + horarios */}
      {servicio && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">3. ¿Qué día?</h2>
          <MiniCalendario value={fecha} minFecha={hoyArgentina()} onChange={setFecha} />

          <div className="pt-2">
            {cargandoSlots && <p className="text-sm text-gray-400">Buscando horarios libres...</p>}
            {!cargandoSlots && slots && slots.length === 0 && (
              <p className="text-sm text-gray-400">
                No hay horarios libres ese día. Probá con otra fecha.
              </p>
            )}
            {!cargandoSlots && slots && slots.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={`${slot.peluqueroId}-${slot.hora}`}
                    type="button"
                    onClick={() => setSlotElegido(slot)}
                    title={peluqueroId === OPCION_CUALQUIERA ? slot.peluqueroNombre : undefined}
                    className={`rounded-md border px-2 py-1.5 text-sm ${
                      slotElegido?.hora === slot.hora && slotElegido.peluqueroId === slot.peluqueroId
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
        </section>
      )}

      {/* 4. Datos de contacto */}
      {slotElegido && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">4. Tus datos</h2>
          <input
            type="text"
            placeholder="Nombre"
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Teléfono (para avisarte si hace falta)"
            value={telefonoCliente}
            onChange={(e) => setTelefonoCliente(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </section>
      )}

      {errorEnvio && <p className="text-sm text-red-600">{errorEnvio}</p>}

      {slotElegido && (
        <button
          type="button"
          disabled={!puedeConfirmar || enviando}
          onClick={confirmar}
          className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {enviando
            ? "Confirmando..."
            : `Confirmar turno · ${servicio ? formatoPrecio.format(servicio.precio) : ""} (efectivo en el local)`}
        </button>
      )}
    </div>
  );
}

function ConfirmacionReserva({ turno }: { turno: TurnoConfirmado }) {
  const linkWhatsApp = construirLinkWhatsApp(turno);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
        ✓
      </div>
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
        className="inline-flex w-full items-center justify-center rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700"
      >
        Avisar por WhatsApp
      </a>
      <p className="text-xs text-gray-400">
        Ya intentamos abrirlo automáticamente. Si no se abrió, tocá el botón para avisarle a{" "}
        {turno.peluqueroNombre}.
      </p>

      <a
        href="/"
        className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Volver al inicio
      </a>
    </div>
  );
}
