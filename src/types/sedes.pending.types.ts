import { Database } from './database.types';

/**
 * TIPOS PROVISIONALES - FASE 4 (OFERTA ACADÉMICA)
 * Estos tipos reflejan el esquema estricto que existirá una vez
 * se ejecute la migración 00010_sedes_oferta.sql.
 * 
 * No se modificó database.types.ts para evitar errores masivos de 
 * compilación mientras 00010 sigue pendiente. 
 * Una vez ejecutada la migración, regenerar database.types.ts desde
 * Supabase y eliminar este archivo.
 */

export type SedeRow = {
  id: string;
  codigo: string;
  nombre: string;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  direccion: string | null;
  status: 'ACTIVO' | 'INACTIVO';
  created_at: string;
  updated_at: string;
};

export type UsuarioSedeRow = {
  id: string;
  usuario_id: string;
  sede_id: string;
  created_at: string;
};

// Extensiones de tablas existentes (reflejando NOT NULL)
export type ProspectoRowConSede = Database['public']['Tables']['prospectos']['Row'] & {
  sede_id: string;
};
export type ProspectoInsertConSede = Database['public']['Tables']['prospectos']['Insert'] & {
  sede_id: string;
};
export type ProspectoUpdateConSede = Database['public']['Tables']['prospectos']['Update'] & {
  sede_id?: string;
};

export type EdicionRowConSede = Database['public']['Tables']['ediciones']['Row'] & {
  sede_id: string;
};
export type EdicionInsertConSede = Database['public']['Tables']['ediciones']['Insert'] & {
  sede_id: string;
};
export type EdicionUpdateConSede = Database['public']['Tables']['ediciones']['Update'] & {
  sede_id?: string;
};

export type DatabaseWithSedes = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Database['public']['Tables'] & {
      sedes: {
        Row: SedeRow;
        Insert: Omit<SedeRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SedeRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      usuario_sedes: {
        Row: UsuarioSedeRow;
        Insert: Omit<UsuarioSedeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<UsuarioSedeRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
  };
};
