import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearTurnoEnBaseDeDatos } from "@/lib/reserva/crear-turno";

/**
 * Notificación de Mercado Pago cuando cambia el estado de un pago. El
 * turno recién se crea acá, cuando el pago queda "approved" — ver el
 * comentario en src/lib/reserva/mercadopago-actions.ts sobre por qué no se
 * crea antes. Siempre respondemos 200: si devolviéramos un error, Mercado
 * Pago reintentaría la notificación indefinidamente.
 */
export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const notificacion = body as { type?: string; data?: { id?: string } };
  const paymentId = notificacion?.data?.id;
  if (notificacion?.type !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true });
  }

  const client = new MercadoPagoConfig({ accessToken });
  const paymentApi = new Payment(client);

  let pago;
  try {
    pago = await paymentApi.get({ id: paymentId });
  } catch (e) {
    console.error("No se pudo obtener el pago de Mercado Pago", paymentId, e);
    return NextResponse.json({ ok: true });
  }

  if (pago.status !== "approved") {
    return NextResponse.json({ ok: true });
  }

  const meta = (pago.metadata ?? {}) as Record<string, string | undefined>;
  const servicioId = meta.servicio_id;
  const peluqueroId = meta.peluquero_id;
  const fecha = meta.fecha;
  const horaInicio = meta.hora_inicio;
  const nombreCliente = meta.nombre_cliente;
  const telefonoCliente = meta.telefono_cliente;

  if (!servicioId || !peluqueroId || !fecha || !horaInicio || !nombreCliente || !telefonoCliente) {
    console.error("Pago aprobado sin metadata completa del turno", pago.id);
    return NextResponse.json({ ok: true });
  }

  const mercadoPagoId = String(pago.id);

  // Mercado Pago puede reenviar la misma notificación más de una vez: si
  // ya creamos el turno para este pago, no lo duplicamos.
  const supabase = createAdminClient();
  const { data: existente } = await supabase
    .from("turnos")
    .select("id")
    .eq("mercado_pago_id", mercadoPagoId)
    .maybeSingle();
  if (existente) {
    return NextResponse.json({ ok: true });
  }

  const resultado = await crearTurnoEnBaseDeDatos({
    servicioId,
    peluqueroId,
    fecha,
    horaInicio,
    nombreCliente,
    telefonoCliente,
    estado: "pagado",
    mercadoPagoId,
  });

  if (!resultado.ok) {
    // El pago quedó aprobado pero no pudimos crear el turno (típicamente
    // porque otra persona tomó ese horario justo antes). No hay forma
    // automática de devolver el dinero ni de avisarle al cliente desde acá
    // — queda para revisión manual del admin en los logs.
    console.error("Pago aprobado pero no se pudo crear el turno", mercadoPagoId, resultado.error);
  }

  return NextResponse.json({ ok: true });
}

// Mercado Pago a veces hace un GET para verificar que la URL responde.
export async function GET() {
  return NextResponse.json({ ok: true });
}
