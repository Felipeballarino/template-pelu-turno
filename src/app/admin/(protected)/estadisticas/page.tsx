import Link from "next/link";
import { ListChecks, CheckCircle2, Clock3, XCircle, PercentCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hoyArgentina, formatearFechaLarga } from "@/lib/date";
import { inicioSemana, inicioMes, mesSiguiente, sumarDias } from "@/lib/semana";
import { StatTile } from "../stat-tile";
import { RankingList, type RankingItem } from "./ranking-list";

interface EstadisticasPageProps {
  searchParams: Promise<{ periodo?: string }>;
}

export default async function EstadisticasPage({ searchParams }: EstadisticasPageProps) {
  const params = await searchParams;
  const periodo = params.periodo === "mes" ? "mes" : "semana";
  const hoy = hoyArgentina();

  const desde = periodo === "mes" ? inicioMes(hoy) : inicioSemana(hoy);
  const hasta = periodo === "mes" ? sumarDias(mesSiguiente(hoy), -1) : sumarDias(desde, 6);

  const supabase = await createClient();
  const { data: turnos, error } = await supabase
    .from("turnos")
    .select("id, estado, servicios(nombre), peluqueros(nombre)")
    .gte("fecha", desde)
    .lte("fecha", hasta);

  const filas = (turnos ?? []).map((t) => {
    const servicio = Array.isArray(t.servicios) ? t.servicios[0] : t.servicios;
    const peluquero = Array.isArray(t.peluqueros) ? t.peluqueros[0] : t.peluqueros;
    return {
      estado: t.estado,
      servicioNombre: servicio?.nombre ?? "—",
      peluqueroNombre: peluquero?.nombre ?? "—",
    };
  });

  const total = filas.length;
  const pagados = filas.filter((f) => f.estado === "pagado").length;
  const pendientes = filas.filter((f) => f.estado === "pendiente_efectivo").length;
  const cancelados = filas.filter((f) => f.estado === "cancelado").length;
  const tasaCancelacion = total > 0 ? Math.round((cancelados / total) * 100) : 0;

  function ranking(clave: "servicioNombre" | "peluqueroNombre"): RankingItem[] {
    const conteos = new Map<string, number>();
    for (const f of filas) {
      if (f.estado === "cancelado") continue;
      conteos.set(f[clave], (conteos.get(f[clave]) ?? 0) + 1);
    }
    return [...conteos.entries()]
      .map(([label, cantidad]) => ({ id: label, label, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  const rankingServicios = ranking("servicioNombre");
  const rankingPeluqueros = ranking("peluqueroNombre");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Estadísticas</h1>
          <p className="text-sm text-gray-500 capitalize">
            {formatearFechaLarga(desde)} – {formatearFechaLarga(hasta)}
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm font-medium">
          <Link
            href="/admin/estadisticas?periodo=semana"
            className={`rounded-md px-3 py-1.5 transition-colors ${
              periodo === "semana" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Esta semana
          </Link>
          <Link
            href="/admin/estadisticas?periodo=mes"
            className={`rounded-md px-3 py-1.5 transition-colors ${
              periodo === "mes" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Este mes
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">Error al cargar turnos: {error.message}</p>}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <StatTile icono={ListChecks} valor={total} etiqueta="Turnos totales" color="violeta" />
        <StatTile icono={CheckCircle2} valor={pagados} etiqueta="Pagados" color="verde" />
        <StatTile icono={Clock3} valor={pendientes} etiqueta="Pendientes" color="ambar" />
        <StatTile icono={XCircle} valor={cancelados} etiqueta="Cancelados" color="gris" />
        <StatTile
          icono={PercentCircle}
          valor={`${tasaCancelacion}%`}
          etiqueta="Tasa de cancelación"
          color="ambar"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Servicios más pedidos</h2>
          <RankingList
            items={rankingServicios}
            vacioTexto="Sin turnos activos en este período."
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Turnos por peluquero</h2>
          <RankingList
            items={rankingPeluqueros}
            vacioTexto="Sin turnos activos en este período."
          />
        </section>
      </div>
    </div>
  );
}
