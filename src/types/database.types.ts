export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          correlation_id: string | null
          data_after: Json | null
          data_before: Json | null
          detail: string | null
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          module: string | null
          result: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          correlation_id?: string | null
          data_after?: Json | null
          data_before?: Json | null
          detail?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          module?: string | null
          result?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          correlation_id?: string | null
          data_after?: Json | null
          data_before?: Json | null
          detail?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          module?: string | null
          result?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      catalogos_comerciales: {
        Row: {
          active: boolean | null
          codigo: string
          created_at: string | null
          descripcion: string | null
          es_sistema: boolean | null
          id: string
          nombre: string
          orden: number | null
          tipo_catalogo: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          codigo: string
          created_at?: string | null
          descripcion?: string | null
          es_sistema?: boolean | null
          id?: string
          nombre: string
          orden?: number | null
          tipo_catalogo: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          codigo?: string
          created_at?: string | null
          descripcion?: string | null
          es_sistema?: boolean | null
          id?: string
          nombre?: string
          orden?: number | null
          tipo_catalogo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ciclos: {
        Row: {
          codigo: string | null
          created_at: string | null
          created_by: string | null
          id: string
          nombre: string | null
          numero_orden: number | null
          plan_id: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          nombre?: string | null
          numero_orden?: number | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          nombre?: string | null
          numero_orden?: number | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ciclos_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_estudio"
            referencedColumns: ["id"]
          },
        ]
      }
      cuotas: {
        Row: {
          concepto: string | null
          created_at: string | null
          descuento: number | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          importe_neto: number | null
          importe_original: number | null
          matricula_id: string
          numero_cuota: number | null
          recargo: number | null
          saldo: number | null
          status: string | null
          tipo_cuota: string | null
          updated_at: string | null
        }
        Insert: {
          concepto?: string | null
          created_at?: string | null
          descuento?: number | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          importe_neto?: number | null
          importe_original?: number | null
          matricula_id: string
          numero_cuota?: number | null
          recargo?: number | null
          saldo?: number | null
          status?: string | null
          tipo_cuota?: string | null
          updated_at?: string | null
        }
        Update: {
          concepto?: string | null
          created_at?: string | null
          descuento?: number | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          importe_neto?: number | null
          importe_original?: number | null
          matricula_id?: string
          numero_cuota?: number | null
          recargo?: number | null
          saldo?: number | null
          status?: string | null
          tipo_cuota?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cuotas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ciclo_id: string | null
          codigo: string | null
          created_at: string | null
          created_by: string | null
          creditos: number | null
          horas_semanales: number | null
          id: string
          nombre: string | null
          plan_id: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ciclo_id?: string | null
          codigo?: string | null
          created_at?: string | null
          created_by?: string | null
          creditos?: number | null
          horas_semanales?: number | null
          id?: string
          nombre?: string | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ciclo_id?: string | null
          codigo?: string | null
          created_at?: string | null
          created_by?: string | null
          creditos?: number | null
          horas_semanales?: number | null
          id?: string
          nombre?: string | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_estudio"
            referencedColumns: ["id"]
          },
        ]
      }
      ediciones: {
        Row: {
          ciclo_id: string | null
          codigo: string
          created_at: string | null
          dias_reserva: number | null
          fecha_fin: string | null
          fecha_inicio: string | null
          frecuencia_meses: number | null
          id: string
          modalidad: string | null
          nombre: string | null
          numero_pensiones: number | null
          periodo_id: string | null
          plan_id: string | null
          precio_matricula: number | null
          precio_pension: number | null
          primer_vencimiento: string | null
          programa_id: string | null
          status: string | null
          turno: string | null
          updated_at: string | null
          vacantes: number | null
        }
        Insert: {
          ciclo_id?: string | null
          codigo: string
          created_at?: string | null
          dias_reserva?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          frecuencia_meses?: number | null
          id?: string
          modalidad?: string | null
          nombre?: string | null
          numero_pensiones?: number | null
          periodo_id?: string | null
          plan_id?: string | null
          precio_matricula?: number | null
          precio_pension?: number | null
          primer_vencimiento?: string | null
          programa_id?: string | null
          status?: string | null
          turno?: string | null
          updated_at?: string | null
          vacantes?: number | null
        }
        Update: {
          ciclo_id?: string | null
          codigo?: string
          created_at?: string | null
          dias_reserva?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          frecuencia_meses?: number | null
          id?: string
          modalidad?: string | null
          nombre?: string | null
          numero_pensiones?: number | null
          periodo_id?: string | null
          plan_id?: string | null
          precio_matricula?: number | null
          precio_pension?: number | null
          primer_vencimiento?: string | null
          programa_id?: string | null
          status?: string | null
          turno?: string | null
          updated_at?: string | null
          vacantes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ediciones_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ediciones_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ediciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_estudio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ediciones_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
        ]
      }
      estudiantes: {
        Row: {
          codigo_estudiante: string | null
          created_at: string | null
          created_by: string | null
          fecha_ingreso: string | null
          id: string
          observaciones: string | null
          persona_id: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          codigo_estudiante?: string | null
          created_at?: string | null
          created_by?: string | null
          fecha_ingreso?: string | null
          id?: string
          observaciones?: string | null
          persona_id: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          codigo_estudiante?: string | null
          created_at?: string | null
          created_by?: string | null
          fecha_ingreso?: string | null
          id?: string
          observaciones?: string | null
          persona_id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estudiantes_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: true
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios: {
        Row: {
          created_at: string | null
          created_by: string | null
          curso_id: string | null
          dia_semana: string | null
          docente: string | null
          edicion_id: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          observaciones: string | null
          status: string | null
          ubicacion: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          curso_id?: string | null
          dia_semana?: string | null
          docente?: string | null
          edicion_id?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          observaciones?: string | null
          status?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          curso_id?: string | null
          dia_semana?: string | null
          docente?: string | null
          edicion_id?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          observaciones?: string | null
          status?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horarios_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_edicion_id_fkey"
            columns: ["edicion_id"]
            isOneToOne: false
            referencedRelation: "ediciones"
            referencedColumns: ["id"]
          },
        ]
      }
      institutional_config: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      matriculas: {
        Row: {
          activada_en: string | null
          anulada_en: string | null
          asesor_comercial_id: string | null
          ciclo_id: string | null
          ciclo_ingreso: string | null
          codigo_matricula: string
          created_at: string | null
          created_by: string | null
          cuotas_generadas_en: string | null
          descuento_autorizado_por: string | null
          descuento_motivo: string | null
          descuento_total: number | null
          edicion_id: string
          estudiante_id: string
          fecha_matricula: string | null
          fecha_prematricula: string | null
          finalizada_en: string | null
          frecuencia_meses: number | null
          id: string
          importe_matricula: number | null
          importe_pension: number | null
          motivo_estado: string | null
          numero_pensiones: number | null
          observaciones: string | null
          pdf_generado_en: string | null
          pdf_storage_path: string | null
          primer_vencimiento: string | null
          prospecto_id: string | null
          reserva_vence_en: string | null
          reservada_en: string | null
          retirada_en: string | null
          status: string | null
          tipo_matricula: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          activada_en?: string | null
          anulada_en?: string | null
          asesor_comercial_id?: string | null
          ciclo_id?: string | null
          ciclo_ingreso?: string | null
          codigo_matricula: string
          created_at?: string | null
          created_by?: string | null
          cuotas_generadas_en?: string | null
          descuento_autorizado_por?: string | null
          descuento_motivo?: string | null
          descuento_total?: number | null
          edicion_id: string
          estudiante_id: string
          fecha_matricula?: string | null
          fecha_prematricula?: string | null
          finalizada_en?: string | null
          frecuencia_meses?: number | null
          id?: string
          importe_matricula?: number | null
          importe_pension?: number | null
          motivo_estado?: string | null
          numero_pensiones?: number | null
          observaciones?: string | null
          pdf_generado_en?: string | null
          pdf_storage_path?: string | null
          primer_vencimiento?: string | null
          prospecto_id?: string | null
          reserva_vence_en?: string | null
          reservada_en?: string | null
          retirada_en?: string | null
          status?: string | null
          tipo_matricula?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          activada_en?: string | null
          anulada_en?: string | null
          asesor_comercial_id?: string | null
          ciclo_id?: string | null
          ciclo_ingreso?: string | null
          codigo_matricula?: string
          created_at?: string | null
          created_by?: string | null
          cuotas_generadas_en?: string | null
          descuento_autorizado_por?: string | null
          descuento_motivo?: string | null
          descuento_total?: number | null
          edicion_id?: string
          estudiante_id?: string
          fecha_matricula?: string | null
          fecha_prematricula?: string | null
          finalizada_en?: string | null
          frecuencia_meses?: number | null
          id?: string
          importe_matricula?: number | null
          importe_pension?: number | null
          motivo_estado?: string | null
          numero_pensiones?: number | null
          observaciones?: string | null
          pdf_generado_en?: string | null
          pdf_storage_path?: string | null
          primer_vencimiento?: string | null
          prospecto_id?: string | null
          reserva_vence_en?: string | null
          reservada_en?: string | null
          retirada_en?: string | null
          status?: string | null
          tipo_matricula?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_asesor_comercial_id_fkey"
            columns: ["asesor_comercial_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_descuento_autorizado_por_fkey"
            columns: ["descuento_autorizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_edicion_id_fkey"
            columns: ["edicion_id"]
            isOneToOne: false
            referencedRelation: "ediciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades: {
        Row: {
          active: boolean | null
          codigo: string
          id: string
          nombre: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          codigo: string
          id?: string
          nombre: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          codigo?: string
          id?: string
          nombre?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      pago_aplicaciones: {
        Row: {
          created_at: string | null
          created_by: string | null
          cuota_id: string
          id: string
          importe_aplicado: number | null
          pago_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cuota_id: string
          id?: string
          importe_aplicado?: number | null
          pago_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cuota_id?: string
          id?: string
          importe_aplicado?: number | null
          pago_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pago_aplicaciones_cuota_id_fkey"
            columns: ["cuota_id"]
            isOneToOne: false
            referencedRelation: "cuotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_aplicaciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          anulado_en: string | null
          anulado_por: string | null
          comprobante_numero: string | null
          comprobante_tipo: string | null
          estudiante_id: string
          fecha_pago: string | null
          id: string
          importe: number | null
          medio_pago: string | null
          motivo_anulacion: string | null
          numero_operacion: string | null
          observaciones: string | null
          registrado_en: string | null
          registrado_por: string | null
          status: string | null
        }
        Insert: {
          anulado_en?: string | null
          anulado_por?: string | null
          comprobante_numero?: string | null
          comprobante_tipo?: string | null
          estudiante_id: string
          fecha_pago?: string | null
          id?: string
          importe?: number | null
          medio_pago?: string | null
          motivo_anulacion?: string | null
          numero_operacion?: string | null
          observaciones?: string | null
          registrado_en?: string | null
          registrado_por?: string | null
          status?: string | null
        }
        Update: {
          anulado_en?: string | null
          anulado_por?: string | null
          comprobante_numero?: string | null
          comprobante_tipo?: string | null
          estudiante_id?: string
          fecha_pago?: string | null
          id?: string
          importe?: number | null
          medio_pago?: string | null
          motivo_anulacion?: string | null
          numero_operacion?: string | null
          observaciones?: string | null
          registrado_en?: string | null
          registrado_por?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      periodos: {
        Row: {
          codigo: string
          created_at: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          nombre: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          description: string | null
          id: string
          module: string | null
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          module?: string | null
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          module?: string | null
          name?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          apellido_materno: string | null
          apellido_paterno: string | null
          created_at: string | null
          departamento: string | null
          direccion: string | null
          distrito: string | null
          email: string | null
          fecha_nacimiento: string | null
          id: string
          nombres: string | null
          numero_documento: string | null
          provincia: string | null
          status: string | null
          telefono: string | null
          tipo_documento: string | null
          updated_at: string | null
        }
        Insert: {
          apellido_materno?: string | null
          apellido_paterno?: string | null
          created_at?: string | null
          departamento?: string | null
          direccion?: string | null
          distrito?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombres?: string | null
          numero_documento?: string | null
          provincia?: string | null
          status?: string | null
          telefono?: string | null
          tipo_documento?: string | null
          updated_at?: string | null
        }
        Update: {
          apellido_materno?: string | null
          apellido_paterno?: string | null
          created_at?: string | null
          departamento?: string | null
          direccion?: string | null
          distrito?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombres?: string | null
          numero_documento?: string | null
          provincia?: string | null
          status?: string | null
          telefono?: string | null
          tipo_documento?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      planes_estudio: {
        Row: {
          codigo: string
          created_at: string | null
          fecha_vigencia_desde: string | null
          fecha_vigencia_hasta: string | null
          id: string
          nombre: string
          programa_id: string | null
          status: string | null
          total_ciclos: number | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          fecha_vigencia_desde?: string | null
          fecha_vigencia_hasta?: string | null
          id?: string
          nombre: string
          programa_id?: string | null
          status?: string | null
          total_ciclos?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          fecha_vigencia_desde?: string | null
          fecha_vigencia_hasta?: string | null
          id?: string
          nombre?: string
          programa_id?: string | null
          status?: string | null
          total_ciclos?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planes_estudio_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activated_at: string | null
          created_at: string | null
          created_by: string | null
          display_name: string | null
          email: string | null
          id: string
          invited_at: string | null
          last_access_at: string | null
          persona_id: string | null
          photo_url: string | null
          role_id: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          invited_at?: string | null
          last_access_at?: string | null
          persona_id?: string | null
          photo_url?: string | null
          role_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          invited_at?: string | null
          last_access_at?: string | null
          persona_id?: string | null
          photo_url?: string | null
          role_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      programas: {
        Row: {
          codigo: string
          created_at: string | null
          descripcion: string | null
          duracion_cantidad: number | null
          duracion_unidad: string | null
          id: string
          nombre: string
          status: string | null
          tipo_programa: string | null
          total_ciclos: number | null
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          descripcion?: string | null
          duracion_cantidad?: number | null
          duracion_unidad?: string | null
          id?: string
          nombre: string
          status?: string | null
          tipo_programa?: string | null
          total_ciclos?: number | null
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          descripcion?: string | null
          duracion_cantidad?: number | null
          duracion_unidad?: string | null
          id?: string
          nombre?: string
          status?: string | null
          tipo_programa?: string | null
          total_ciclos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prospectos: {
        Row: {
          apellidos: string | null
          asesor_conversion_id: string | null
          asesor_id: string | null
          campana: string | null
          canal_captacion: string | null
          codigo: string
          consentimiento_contacto: boolean | null
          created_at: string | null
          created_by: string | null
          departamento: string | null
          detalle_perdida: string | null
          distrito: string | null
          edicion_id: string | null
          email: string | null
          estudiante_id: string | null
          fecha_conversion: string | null
          id: string
          matricula_id: string | null
          modalidad: string | null
          motivo_perdida: string | null
          nivel_interes: string | null
          nombres: string | null
          numero_documento: string | null
          observaciones: string | null
          persona_id: string | null
          plan_id: string | null
          programa_id: string | null
          provincia: string | null
          proximo_seguimiento_en: string | null
          status: string | null
          status_registro: string | null
          telefono: string | null
          telefono_alt: string | null
          tipo_documento: string | null
          turno: string | null
          ultimo_contacto_en: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          apellidos?: string | null
          asesor_conversion_id?: string | null
          asesor_id?: string | null
          campana?: string | null
          canal_captacion?: string | null
          codigo: string
          consentimiento_contacto?: boolean | null
          created_at?: string | null
          created_by?: string | null
          departamento?: string | null
          detalle_perdida?: string | null
          distrito?: string | null
          edicion_id?: string | null
          email?: string | null
          estudiante_id?: string | null
          fecha_conversion?: string | null
          id?: string
          matricula_id?: string | null
          modalidad?: string | null
          motivo_perdida?: string | null
          nivel_interes?: string | null
          nombres?: string | null
          numero_documento?: string | null
          observaciones?: string | null
          persona_id?: string | null
          plan_id?: string | null
          programa_id?: string | null
          provincia?: string | null
          proximo_seguimiento_en?: string | null
          status?: string | null
          status_registro?: string | null
          telefono?: string | null
          telefono_alt?: string | null
          tipo_documento?: string | null
          turno?: string | null
          ultimo_contacto_en?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          apellidos?: string | null
          asesor_conversion_id?: string | null
          asesor_id?: string | null
          campana?: string | null
          canal_captacion?: string | null
          codigo?: string
          consentimiento_contacto?: boolean | null
          created_at?: string | null
          created_by?: string | null
          departamento?: string | null
          detalle_perdida?: string | null
          distrito?: string | null
          edicion_id?: string | null
          email?: string | null
          estudiante_id?: string | null
          fecha_conversion?: string | null
          id?: string
          matricula_id?: string | null
          modalidad?: string | null
          motivo_perdida?: string | null
          nivel_interes?: string | null
          nombres?: string | null
          numero_documento?: string | null
          observaciones?: string | null
          persona_id?: string | null
          plan_id?: string | null
          programa_id?: string | null
          provincia?: string | null
          proximo_seguimiento_en?: string | null
          status?: string | null
          status_registro?: string | null
          telefono?: string | null
          telefono_alt?: string | null
          tipo_documento?: string | null
          turno?: string | null
          ultimo_contacto_en?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prospecto_matricula"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospectos_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospectos_edicion_id_fkey"
            columns: ["edicion_id"]
            isOneToOne: false
            referencedRelation: "ediciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospectos_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospectos_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospectos_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_estudio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospectos_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seguimientos: {
        Row: {
          asesor_id: string | null
          created_at: string | null
          created_by: string | null
          estado_anterior: string | null
          estado_nuevo: string | null
          fecha_hora: string | null
          id: string
          nota: string | null
          prospecto_id: string | null
          proximo_seguimiento: string | null
          resultado: string | null
          status_registro: string | null
          tipo_actividad: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          asesor_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado_anterior?: string | null
          estado_nuevo?: string | null
          fecha_hora?: string | null
          id?: string
          nota?: string | null
          prospecto_id?: string | null
          proximo_seguimiento?: string | null
          resultado?: string | null
          status_registro?: string | null
          tipo_actividad?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          asesor_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado_anterior?: string | null
          estado_nuevo?: string | null
          fecha_hora?: string | null
          id?: string
          nota?: string | null
          prospecto_id?: string | null
          proximo_seguimiento?: string | null
          resultado?: string | null
          status_registro?: string | null
          tipo_actividad?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seguimientos_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_comerciales: {
        Row: {
          asesor_id: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          fecha_programada: string | null
          fecha_realizada: string | null
          id: string
          prospecto_id: string | null
          resultado: string | null
          status: string | null
          status_registro: string | null
          tipo_tarea: string | null
          titulo: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          asesor_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          fecha_programada?: string | null
          fecha_realizada?: string | null
          id?: string
          prospecto_id?: string | null
          resultado?: string | null
          status?: string | null
          status_registro?: string | null
          tipo_tarea?: string | null
          titulo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          asesor_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          fecha_programada?: string | null
          fecha_realizada?: string | null
          id?: string
          prospecto_id?: string | null
          resultado?: string | null
          status?: string | null
          status_registro?: string | null
          tipo_tarea?: string | null
          titulo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_comerciales_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_comerciales_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencias_prospectos: {
        Row: {
          asesor_anterior_id: string | null
          asesor_nuevo_id: string | null
          created_at: string | null
          created_by: string | null
          fecha_hora: string | null
          id: string
          motivo: string | null
          prospecto_id: string | null
          status_registro: string | null
          usuario_id: string | null
        }
        Insert: {
          asesor_anterior_id?: string | null
          asesor_nuevo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          fecha_hora?: string | null
          id?: string
          motivo?: string | null
          prospecto_id?: string | null
          status_registro?: string | null
          usuario_id?: string | null
        }
        Update: {
          asesor_anterior_id?: string | null
          asesor_nuevo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          fecha_hora?: string | null
          id?: string
          motivo?: string | null
          prospecto_id?: string | null
          status_registro?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_prospectos_asesor_anterior_id_fkey"
            columns: ["asesor_anterior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_prospectos_asesor_nuevo_id_fkey"
            columns: ["asesor_nuevo_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_prospectos_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          active: boolean | null
          codigo: string
          id: string
          nombre: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          codigo: string
          id?: string
          nombre: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          codigo?: string
          id?: string
          nombre?: string
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role_id: { Args: never; Returns: string }
      has_permission: { Args: { permission_code: string }; Returns: boolean }
      log_audit_entry: {
        Args: {
          p_action: string
          p_correlation_id?: string
          p_data_after?: Json
          p_data_before?: Json
          p_detail?: string
          p_entity: string
          p_entity_id: string
          p_ip_address?: string
          p_module: string
          p_result?: string
          p_user_agent?: string
          p_user_id: string
          p_user_role: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
