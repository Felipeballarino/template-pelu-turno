import { createClient } from "@/lib/supabase/server";
import { Inicio } from "@/components/reserva/inicio";

export default async function Home() {
  const supabase = await createClient();

  const [{ data: servicios }, { data: peluqueros }, { data: asignaciones }] = await Promise.all([
    supabase.from("servicios").select("*").eq("activo", true).order("nombre"),
    supabase.from("peluqueros").select("*").eq("activo", true).order("nombre"),
    supabase.from("peluquero_servicios").select("peluquero_id, servicio_id"),
  ]);

  return (
    <Inicio
      servicios={servicios ?? []}
      peluqueros={peluqueros ?? []}
      asignaciones={asignaciones ?? []}
      // Pago con Mercado Pago desactivado por el momento: solo se paga en el local.
      mercadoPagoHabilitado={false}
    />
  );
}
