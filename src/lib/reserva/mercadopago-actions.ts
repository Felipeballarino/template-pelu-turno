"use server";

import { MercadoPagoConfig, Preference } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerHorariosDisponibles } from "./actions";

export interface ResultadoPreferencia {
  ok: boolean;
  error?: string;
  initPoint?: string;
}

/**
 * Crea una preferencia de pago en Mercado Pago Checkout Pro para un turno
 * que TODAVÍA no existe en la base. El turno recién se crea cuando el pago
 * se confirma (ver src/app/api/mercadopago/webhook/route.ts) — así, si el
 * cliente abandona el pago a mitad de camino, nunca queda un horario
 * "trabado" sin poder ofrecerse a otra persona. Los datos del turno viajan
 * en el `metadata` de la preferencia para que el webhook los recupere.
 */
export async function crearPreferenciaMercadoPago(input: {
  servicioId: string;
  peluqueroId: string;
  fecha: string;
  horaInicio: string;
  nombreCliente: string;
  telefonoCliente: string;
}): Promise<ResultadoPreferencia> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!accessToken || !siteUrl) {
    return { ok: false, error: "Los pagos con Mercado Pago no están configurados todavía." };
  }

  const nombreCliente = input.nombreCliente.trim();
  const telefonoCliente = input.telefonoCliente.trim();

  if (
    !input.servicioId ||
    !input.peluqueroId ||
    !input.fecha ||
    !input.horaInicio ||
    !nombreCliente ||
    !telefonoCliente
  ) {
    return { ok: false, error: "Faltan datos para iniciar el pago." };
  }

  const supabase = createAdminClient();

  const { data: servicio, error: errorServicio } = await supabase
    .from("servicios")
    .select("nombre, precio, duracion_minutos")
    .eq("id", input.servicioId)
    .single();
  if (errorServicio || !servicio) {
    return { ok: false, error: "El servicio elegido ya no está disponible." };
  }

  // No reservamos el horario a esta altura (no se crea el turno todavía),
  // así que esto es solo una verificación de cortesía: reduce, pero no
  // elimina del todo, la chance de mandar a alguien a pagar por un horario
  // que ya se ocupó. La garantía real es el constraint anti-solapamiento
  // de la base, que corre recién al crear el turno en el webhook.
  const slotsLibres = await obtenerHorariosDisponibles({
    peluqueroId: input.peluqueroId,
    servicioId: input.servicioId,
    fecha: input.fecha,
    duracionMinutos: servicio.duracion_minutos,
  });
  const sigueLibre = slotsLibres.some(
    (s) => s.hora === input.horaInicio && s.peluqueroId === input.peluqueroId
  );
  if (!sigueLibre) {
    return { ok: false, error: "Ese horario ya no está disponible. Elegí otro, por favor." };
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
    const resultado = await preference.create({
      body: {
        items: [
          {
            id: input.servicioId,
            title: servicio.nombre,
            quantity: 1,
            unit_price: servicio.precio,
            currency_id: "ARS",
          },
        ],
        payer: { name: nombreCliente },
        metadata: {
          servicio_id: input.servicioId,
          peluquero_id: input.peluqueroId,
          fecha: input.fecha,
          hora_inicio: input.horaInicio,
          nombre_cliente: nombreCliente,
          telefono_cliente: telefonoCliente,
        },
        back_urls: {
          success: `${siteUrl}/?pago=exitoso`,
          failure: `${siteUrl}/?pago=fallido`,
          pending: `${siteUrl}/?pago=pendiente`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/mercadopago/webhook`,
      },
    });

    if (!resultado.init_point) {
      return { ok: false, error: "No se pudo iniciar el pago. Probá de nuevo." };
    }

    return { ok: true, initPoint: resultado.init_point };
  } catch (e) {
    console.error("Error creando preferencia de Mercado Pago", e);
    return { ok: false, error: "No se pudo iniciar el pago. Probá de nuevo." };
  }
}
