/**
 * Tipos de la base de datos, escritos a mano en espejo de supabase/schema.sql.
 *
 * Alternativa a futuro: generarlos automáticamente con
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 * Por ahora los mantenemos manuales porque el esquema es chico y estable.
 */

export type EstadoTurno = "pagado" | "pendiente_efectivo" | "cancelado";

export interface Database {
  public: {
    Tables: {
      peluqueros: {
        Row: {
          id: string;
          nombre: string;
          telefono_whatsapp: string;
          activo: boolean;
          creado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          telefono_whatsapp: string;
          activo?: boolean;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["peluqueros"]["Insert"]>;
        Relationships: [];
      };
      servicios: {
        Row: {
          id: string;
          nombre: string;
          duracion_minutos: number;
          precio: number;
          activo: boolean;
          creado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          duracion_minutos: number;
          precio: number;
          activo?: boolean;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["servicios"]["Insert"]>;
        Relationships: [];
      };
      turnos: {
        Row: {
          id: string;
          peluquero_id: string;
          servicio_id: string;
          nombre_cliente: string;
          telefono_cliente: string;
          fecha: string; // date, formato YYYY-MM-DD
          hora_inicio: string; // time, formato HH:MM:SS
          hora_fin: string;
          estado: EstadoTurno;
          mercado_pago_id: string | null;
          recordatorio_enviado: boolean;
          creado_en: string;
        };
        Insert: {
          id?: string;
          peluquero_id: string;
          servicio_id: string;
          nombre_cliente: string;
          telefono_cliente: string;
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          estado?: EstadoTurno;
          mercado_pago_id?: string | null;
          recordatorio_enviado?: boolean;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["turnos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "turnos_peluquero_id_fkey";
            columns: ["peluquero_id"];
            isOneToOne: false;
            referencedRelation: "peluqueros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turnos_servicio_id_fkey";
            columns: ["servicio_id"];
            isOneToOne: false;
            referencedRelation: "servicios";
            referencedColumns: ["id"];
          },
        ];
      };
      horarios_laborales: {
        Row: {
          id: string;
          peluquero_id: string;
          dia_semana: number; // 0 = domingo ... 6 = sábado
          hora_inicio: string;
          hora_fin: string;
          creado_en: string;
        };
        Insert: {
          id?: string;
          peluquero_id: string;
          dia_semana: number;
          hora_inicio: string;
          hora_fin: string;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["horarios_laborales"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "horarios_laborales_peluquero_id_fkey";
            columns: ["peluquero_id"];
            isOneToOne: false;
            referencedRelation: "peluqueros";
            referencedColumns: ["id"];
          },
        ];
      };
      bloqueos: {
        Row: {
          id: string;
          peluquero_id: string;
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          motivo: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          peluquero_id: string;
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          motivo?: string | null;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bloqueos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bloqueos_peluquero_id_fkey";
            columns: ["peluquero_id"];
            isOneToOne: false;
            referencedRelation: "peluqueros";
            referencedColumns: ["id"];
          },
        ];
      };
      peluquero_servicios: {
        Row: {
          peluquero_id: string;
          servicio_id: string;
        };
        Insert: {
          peluquero_id: string;
          servicio_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["peluquero_servicios"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "peluquero_servicios_peluquero_id_fkey";
            columns: ["peluquero_id"];
            isOneToOne: false;
            referencedRelation: "peluqueros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "peluquero_servicios_servicio_id_fkey";
            columns: ["servicio_id"];
            isOneToOne: false;
            referencedRelation: "servicios";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      estado_turno: EstadoTurno;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Peluquero = Database["public"]["Tables"]["peluqueros"]["Row"];
export type Servicio = Database["public"]["Tables"]["servicios"]["Row"];
export type Turno = Database["public"]["Tables"]["turnos"]["Row"];
export type HorarioLaboral = Database["public"]["Tables"]["horarios_laborales"]["Row"];
export type Bloqueo = Database["public"]["Tables"]["bloqueos"]["Row"];
export type PeluqueroServicio = Database["public"]["Tables"]["peluquero_servicios"]["Row"];
