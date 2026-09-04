import { obtenerTurnoParaCancelar } from "@/lib/reserva/cancelacion-cliente";
import { CancelarTurnoView } from "./cancelar-turno-view";

export default async function CancelarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const turno = await obtenerTurnoParaCancelar(id);

  return <CancelarTurnoView turno={turno} />;
}
