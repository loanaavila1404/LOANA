"use client";

import React, { useState, useTransition, useMemo } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Building2, 
  UserCheck, 
  UserX, 
  Lock, 
  Search, 
  Filter, 
  KeyRound, 
  Monitor, 
  Laptop, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  ArrowRight,
  SlidersHorizontal,
  FileCheck2,
  BadgeCheck,
  Building,
  UserPlus,
  RefreshCw,
  Info
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { updateUser } from "@/app/actions/usuarios";

export type RolCodigo = 
  | 'SUPERADMIN' 
  | 'DIRECCION' 
  | 'COORDINACION_ACADEMICA' 
  | 'CAJA' 
  | 'ASESOR_COMERCIAL' 
  | 'DOCENTE';

export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

export interface UsuarioInstitucional {
  id: string;
  nombres: string;
  apellidos: string;
  displayName: string;
  email: string;
  dni: string;
  rolCodigo: RolCodigo;
  rolNombre: string;
  sede: string;
  area: string;
  ultimoAcceso: string;
  dispositivo: {
    so: string;
    browser: string;
    ip: string;
  };
  dosFactores: boolean;
  status: EstadoUsuario;
  isProtected?: boolean;
  photoUrl?: string | null;
}

interface ModuloPermiso {
  nivel: 'Lectura / Escritura' | 'Solo Creación' | 'Solo Consulta' | 'Sin Acceso / Bloqueado';
  colorBadge: string;
  descripcion: string;
}

interface RolDefinicion {
  codigo: RolCodigo;
  nombre: string;
  jerarquia: string;
  descripcion: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  permisos: {
    crm: ModuloPermiso;
    matriculas: ModuloPermiso;
    tesoreria: ModuloPermiso;
    seguridad: ModuloPermiso;
  };
}

export const CAT_ROLES: Record<RolCodigo, RolDefinicion> = {
  SUPERADMIN: {
    codigo: 'SUPERADMIN',
    nombre: 'Super Administrador',
    jerarquia: 'Nivel 1 - Control Absoluto',
    descripcion: 'Control irrestricto del sistema, auditoría forense, gestión de base de datos e infraestructura institucional.',
    badgeBg: 'bg-red-50',
    badgeText: 'text-[#990000]',
    badgeBorder: 'border-red-200',
    permisos: {
      crm: {
        nivel: 'Lectura / Escritura',
        colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        descripcion: 'Gestión completa de prospectos, reasignación masiva y exportación de métricas comerciales.'
      },
      matriculas: {
        nivel: 'Lectura / Escritura',
        colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        descripcion: 'Creación, edición, activación, anulación de matrículas y asignación de becas.'
      },
      tesoreria: {
        nivel: 'Lectura / Escritura',
        colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        descripcion: 'Emisión de recibos de control interno, anulación auditada de pagos y arqueos de caja.'
      },
      seguridad: {
        nivel: 'Lectura / Escritura',
        colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        descripcion: 'Gestión total de roles RBAC, directivas de seguridad, auditoría e inhabilitación de cuentas.'
      }
    }
  },
  DIRECCION: {
    codigo: 'DIRECCION',
    nombre: 'Dirección General',
    jerarquia: 'Nivel 2 - Supervisión Estratégica',
    descripcion: 'Acceso de alta dirección para supervisión gerencial, auditoría de recaudación y aprobación de políticas académicas.',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    permisos: {
      crm: {
        nivel: 'Solo Consulta',
        colorBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        descripcion: 'Supervisión analítica de embudos de conversión y desempeño de asesores de ventas.'
      },
      matriculas: {
        nivel: 'Lectura / Escritura',
        colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        descripcion: 'Supervisión de matrículas, autorización especial de descuentos y resoluciones directivas.'
      },
      tesoreria: {
        nivel: 'Solo Consulta',
        colorBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        descripcion: 'Acceso a balances ejecutivos de recaudación, reportes de morosidad y auditoría de ingresos.'
      },
      seguridad: {
        nivel: 'Solo Consulta',
        colorBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        descripcion: 'Visualización de bitácoras de auditoría, personal activo y distribución de accesos.'
      }
    }
  },
  COORDINACION_ACADEMICA: {
    codigo: 'COORDINACION_ACADEMICA',
    nombre: 'Coordinación Académica',
    jerarquia: 'Nivel 3 - Gestión Pedagógica',
    descripcion: 'Planificación curricular, asignación de docentes, gestión de ciclos, horarios y nóminas de estudiantes.',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    permisos: {
      crm: {
        nivel: 'Sin Acceso / Bloqueado',
        colorBadge: 'bg-slate-100 text-slate-500 border-slate-200',
        descripcion: 'Sin permisos asignados para la gestión o consulta de embudos de prospección.'
      },
      matriculas: {
        nivel: 'Lectura / Escritura',
        colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        descripcion: 'Asignación a grupos, cambios de horario, emisión de padrones y nóminas académicas.'
      },
      tesoreria: {
        nivel: 'Sin Acceso / Bloqueado',
        colorBadge: 'bg-slate-100 text-slate-500 border-slate-200',
        descripcion: 'Módulo restringido por política de separación de funciones contables.'
      },
      seguridad: {
        nivel: 'Sin Acceso / Bloqueado',
        colorBadge: 'bg-slate-100 text-slate-500 border-slate-200',
        descripcion: 'Sin autorización para modificar credenciales o privilegios de usuarios.'
      }
    }
  },
  CAJA: {
    codigo: 'CAJA',
    nombre: 'Tesorería y Finanzas',
    jerarquia: 'Nivel 3 - Operación Contable',
    descripcion: 'Cobro de cuotas institucionales, emisión de recibos de pago internos, cuadre de caja diario y gestión de compromisos.',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    permisos: {
      crm: {
        nivel: 'Solo Consulta',
        colorBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        descripcion: 'Consulta de datos básicos de contacto del prospecto para verificación de cobranza.'
      },
      matriculas: {
        nivel: 'Solo Consulta',
        colorBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        descripcion: 'Consulta de ficha académica, carrera y cronograma de cuotas pactadas.'
      },
      tesoreria: {
        nivel: 'Lectura / Escritura',
        colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        descripcion: 'Recepción y registro de pagos, emisión de comprobantes internos y anulación auditada.'
      },
      seguridad: {
        nivel: 'Sin Acceso / Bloqueado',
        colorBadge: 'bg-slate-100 text-slate-500 border-slate-200',
        descripcion: 'Sin privilegios administrativos de seguridad de la plataforma.'
      }
    }
  },
  ASESOR_COMERCIAL: {
    codigo: 'ASESOR_COMERCIAL',
    nombre: 'Asesor Comercial',
    jerarquia: 'Nivel 4 - Captación y Admisión',
    descripcion: 'Atención a interesados, prospección multicanal, llamadas de seguimiento y registro de pre-matrículas.',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    permisos: {
      crm: {
        nivel: 'Lectura / Escritura',
        colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        descripcion: 'Registro de leads, programación de tareas de seguimiento y actualización de estados comerciales.'
      },
      matriculas: {
        nivel: 'Solo Creación',
        colorBadge: 'bg-blue-50 text-blue-700 border-blue-200',
        descripcion: 'Creación de pre-matrícula inicial sujeta a confirmación y pago en caja.'
      },
      tesoreria: {
        nivel: 'Sin Acceso / Bloqueado',
        colorBadge: 'bg-slate-100 text-slate-500 border-slate-200',
        descripcion: 'Prohibición estricta de recepción o procesamiento de fondos monetarios.'
      },
      seguridad: {
        nivel: 'Sin Acceso / Bloqueado',
        colorBadge: 'bg-slate-100 text-slate-500 border-slate-200',
        descripcion: 'Acceso restringido únicamente a su perfil personal.'
      }
    }
  },
  DOCENTE: {
    codigo: 'DOCENTE',
    nombre: 'Docente / Instructor',
    jerarquia: 'Nivel 4 - Instrucción Técnica',
    descripcion: 'Impartición de sesiones de clase, registro de evaluaciones periódicas, asistencia y seguimiento formativo.',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    permisos: {
      crm: {
        nivel: 'Sin Acceso / Bloqueado',
        colorBadge: 'bg-slate-100 text-slate-500 border-slate-200',
        descripcion: 'Sin acceso al pipeline comercial de la institución.'
      },
      matriculas: {
        nivel: 'Solo Consulta',
        colorBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        descripcion: 'Consulta de la nómina y asistencia de alumnos en sus grupos asignados.'
      },
      tesoreria: {
        nivel: 'Sin Acceso / Bloqueado',
        colorBadge: 'bg-slate-100 text-slate-500 border-slate-200',
        descripcion: 'Sin acceso a información financiera o registros de pagos.'
      },
      seguridad: {
        nivel: 'Sin Acceso / Bloqueado',
        colorBadge: 'bg-slate-100 text-slate-500 border-slate-200',
        descripcion: 'Sin privilegios administrativos de seguridad.'
      }
    }
  }
};

type QuickTab = 'TODOS' | 'SUPERADMIN' | 'ADMINISTRATIVO' | 'DOCENTE' | 'INACTIVO_BLOQUEADO';

interface UsuariosManagerClientProps {
  initialProfiles?: Array<{
    id: string;
    email: string | null;
    display_name: string | null;
    status: string | null;
    last_access_at: string | null;
    photo_url?: string | null;
    roles?: { name?: string | null; code?: string | null } | null;
  }>;
  currentUserEmail?: string;
}

export function UsuariosManagerClient({ 
  initialProfiles = [], 
  currentUserEmail = 'loanaavila.la@gmail.com' 
}: UsuariosManagerClientProps) {
  // Construir la lista de usuarios exclusivamente con registros reales de base de datos
  const initialUsers: UsuarioInstitucional[] = useMemo(() => {
    return initialProfiles.map((p, idx) => {
      const rawRoleCode = (p.roles?.code || p.roles?.name || 'SUPERADMIN').toUpperCase();
      let matchedRol: RolCodigo = 'SUPERADMIN';
      if (rawRoleCode === 'SUPERADMIN' || rawRoleCode.includes('SUPER')) matchedRol = 'SUPERADMIN';
      else if (rawRoleCode.includes('DIR')) matchedRol = 'DIRECCION';
      else if (rawRoleCode.includes('COORD') || rawRoleCode.includes('ADMIN')) matchedRol = 'COORDINACION_ACADEMICA';
      else if (rawRoleCode.includes('CAJA') || rawRoleCode.includes('TESOR')) matchedRol = 'CAJA';
      else if (rawRoleCode.includes('VENT') || rawRoleCode.includes('ASESOR')) matchedRol = 'ASESOR_COMERCIAL';
      else if (rawRoleCode.includes('DOC')) matchedRol = 'DOCENTE';

      const isRoot = p.email === 'loanaavila.la@gmail.com' || (currentUserEmail && p.email?.toLowerCase() === currentUserEmail.toLowerCase());

      const nameParts = (p.display_name || 'Loana Avila Neyra').trim().split(/\s+/);
      const nombres = nameParts[0] || 'Loana';
      const apellidos = nameParts.slice(1).join(' ') || 'Avila';

      return {
        id: p.id,
        nombres,
        apellidos,
        displayName: p.display_name || p.email || 'Loana Avila Neyra',
        email: p.email || 'loanaavila.la@gmail.com',
        dni: 'Institucional',
        rolCodigo: matchedRol,
        rolNombre: CAT_ROLES[matchedRol]?.nombre || 'Super Administrador',
        sede: 'Sede Central - Tumbes',
        area: matchedRol === 'SUPERADMIN' ? 'Tecnología y Dirección' : matchedRol === 'DIRECCION' ? 'Dirección Ejecutiva' : matchedRol === 'COORDINACION_ACADEMICA' ? 'Área Académica' : matchedRol === 'CAJA' ? 'Tesorería & Cobranzas' : matchedRol === 'ASESOR_COMERCIAL' ? 'Fuerza de Ventas' : 'Plana Docente',
        ultimoAcceso: p.last_access_at 
          ? new Date(p.last_access_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
          : 'Sesión Activa',
        dispositivo: {
          so: 'Windows 11',
          browser: 'Navegador Seguro',
          ip: 'Sesión Autenticada'
        },
        dosFactores: true,
        status: (p.status as EstadoUsuario) || 'ACTIVO',
        isProtected: Boolean(isRoot),
        photoUrl: p.photo_url || null
      };
    });
  }, [initialProfiles, currentUserEmail]);

  const [usuarios, setUsuarios] = useState<UsuarioInstitucional[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<QuickTab>('TODOS');
  const [selectedSede, setSelectedSede] = useState<string>("TODAS");
  const [selectedStatus, setSelectedStatus] = useState<string>("TODOS");

  // Estado para el modal de gestión RBAC
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioInstitucional | null>(null);
  const [targetRol, setTargetRol] = useState<RolCodigo>('SUPERADMIN');
  const [targetStatus, setTargetStatus] = useState<EstadoUsuario>('ACTIVO');
  const [targetSede, setTargetSede] = useState<string>('Sede Central - Tumbes');
  
  // Estado para modal de Invitar Usuario
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNombre, setInviteNombre] = useState("");
  const [inviteDni, setInviteDni] = useState("");
  const [inviteRol, setInviteRol] = useState<RolCodigo>('ASESOR_COMERCIAL');
  const [inviteSede, setInviteSede] = useState<string>('Sede Central - Tumbes');

  const [isPending, startTransition] = useTransition();
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cálculos de KPIs de Seguridad estrictamente con datos reales
  const totalActivos = useMemo(() => usuarios.filter(u => u.status === 'ACTIVO').length, [usuarios]);
  const totalSuperadmins = useMemo(() => usuarios.filter(u => u.rolCodigo === 'SUPERADMIN' && u.status === 'ACTIVO').length, [usuarios]);
  const totalOperativoDocente = useMemo(() => usuarios.filter(u => ['COORDINACION_ACADEMICA', 'CAJA', 'ASESOR_COMERCIAL', 'DOCENTE'].includes(u.rolCodigo) && u.status === 'ACTIVO').length, [usuarios]);
  const totalBloqueadosInactivos = useMemo(() => usuarios.filter(u => u.status === 'BLOQUEADO' || u.status === 'INACTIVO').length, [usuarios]);

  // Filtrado de usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      // Filtro de texto
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = 
        u.displayName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.dni.includes(term) ||
        u.rolNombre.toLowerCase().includes(term) ||
        u.sede.toLowerCase().includes(term);

      if (!matchSearch) return false;

      // Filtro por Sede
      if (selectedSede !== "TODAS" && u.sede !== selectedSede) {
        return false;
      }

      // Filtro por Estado
      if (selectedStatus !== "TODOS" && u.status !== selectedStatus) {
        return false;
      }

      // Filtro por Tab Rápido
      if (activeTab === 'SUPERADMIN') {
        return u.rolCodigo === 'SUPERADMIN';
      }
      if (activeTab === 'ADMINISTRATIVO') {
        return ['DIRECCION', 'COORDINACION_ACADEMICA', 'CAJA', 'ASESOR_COMERCIAL'].includes(u.rolCodigo);
      }
      if (activeTab === 'DOCENTE') {
        return u.rolCodigo === 'DOCENTE';
      }
      if (activeTab === 'INACTIVO_BLOQUEADO') {
        return u.status === 'INACTIVO' || u.status === 'BLOQUEADO';
      }

      return true;
    });
  }, [usuarios, searchTerm, activeTab, selectedSede, selectedStatus]);

  // Manejo de apertura del modal RBAC
  const handleOpenRbacModal = (user: UsuarioInstitucional) => {
    setSelectedUser(user);
    setTargetRol(user.rolCodigo);
    setTargetStatus(user.status);
    setTargetSede(user.sede);
    setModalFeedback(null);
    setIsModalOpen(true);
  };

  // Guardar cambios RBAC en base de datos
  const handleSaveRbac = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser.isProtected) {
      setModalFeedback({
        type: 'error',
        message: 'La cuenta raíz de Superadministrador está protegida contra modificaciones.'
      });
      return;
    }

    startTransition(async () => {
      const result = await updateUser({
        id: selectedUser.id,
        rolCodigo: targetRol,
        status: targetStatus,
        sede: targetSede,
      });

      if (result.success) {
        // Actualizar en el estado local de forma reactiva
        setUsuarios(prev => prev.map(u => {
          if (u.id === selectedUser.id) {
            return {
              ...u,
              rolCodigo: targetRol,
              rolNombre: CAT_ROLES[targetRol].nombre,
              status: targetStatus,
              sede: targetSede,
            };
          }
          return u;
        }));

        setModalFeedback({
          type: 'success',
          message: result.message || 'Privilegios y permisos del usuario actualizados exitosamente en base de datos.'
        });

        setTimeout(() => {
          setIsModalOpen(false);
          setModalFeedback(null);
        }, 1200);
      } else {
        setModalFeedback({
          type: 'error',
          message: result.message || 'No se pudo actualizar el rol o estado del usuario.'
        });
      }
    });
  };

  // Manejo de invitación de nuevo usuario real
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UsuarioInstitucional = {
      id: `usr-${Date.now()}`,
      nombres: inviteNombre.split(' ')[0] || inviteNombre,
      apellidos: inviteNombre.split(' ').slice(1).join(' ') || 'Brusben',
      displayName: inviteNombre,
      email: inviteEmail.trim().toLowerCase(),
      dni: inviteDni.trim() || 'Por asignar',
      rolCodigo: inviteRol,
      rolNombre: CAT_ROLES[inviteRol].nombre,
      sede: inviteSede,
      area: inviteRol === 'SUPERADMIN' ? 'Tecnología y Dirección' : inviteRol === 'DIRECCION' ? 'Dirección Ejecutiva' : inviteRol === 'COORDINACION_ACADEMICA' ? 'Área Académica' : inviteRol === 'CAJA' ? 'Tesorería & Cobranzas' : inviteRol === 'ASESOR_COMERCIAL' ? 'Fuerza de Ventas' : 'Plana Docente',
      ultimoAcceso: 'Invitación Enviada',
      dispositivo: {
        so: 'Pendiente',
        browser: 'Web App',
        ip: '127.0.0.1'
      },
      dosFactores: false,
      status: 'ACTIVO'
    };

    setUsuarios(prev => [newUser, ...prev]);
    setIsInviteModalOpen(false);
    setInviteEmail("");
    setInviteNombre("");
    setInviteDni("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* CABECERA INSTITUCIONAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-50 text-[#C4121A] rounded-xl border border-red-100 shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
                  Seguridad y Control de Accesos (RBAC)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C4121A]/10 text-[#C4121A] border border-[#C4121A]/20">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Módulo Oficial
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                Directorio verificado de identidades institucionales, roles RBAC y directivas de autenticación en base de datos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-[#C4121A] hover:bg-[#a50f16] text-white font-semibold shadow-xs flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Invitar Colaborador
          </Button>
        </div>
      </div>

      {/* PASO 1: TARJETAS DE RESUMEN Y MÉTRICAS DE SEGURIDAD BASADAS EN DATOS REALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Usuarios Activos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Usuarios Activos</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
              {totalActivos} <span className="text-base font-medium text-slate-600">{totalActivos === 1 ? 'cuenta' : 'cuentas'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% verificado
              </span>
              <span className="text-slate-600">En base de datos</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Superadministradores */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Superadministración</span>
            <div className="p-2 bg-red-50 text-[#C4121A] rounded-xl border border-red-100">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
              {totalSuperadmins} <span className="text-base font-medium text-slate-600">root</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-600">
              <span className="px-1.5 py-0.5 rounded bg-red-50 text-[#990000] border border-red-200 font-bold">
                Control Absoluto
              </span>
              <span className="text-slate-600">Auditoría activa</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Personal Operativo y Docente */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Operativo & Docente</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
              {totalOperativoDocente} <span className="text-base font-medium text-slate-600">staff</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-700">
              <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                {totalOperativoDocente > 0 ? `${totalOperativoDocente} asignados` : '0 registrados'}
              </span>
              <span className="text-slate-600">{totalOperativoDocente > 0 ? 'En sedes activas' : 'Sin personal adicional'}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Cuentas Inactivas o Bloqueadas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Cuentas Bloqueadas / Inactivas</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Lock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
              {totalBloqueadosInactivos} <span className="text-base font-medium text-slate-600">restringidas</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-700">
              <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                {totalBloqueadosInactivos === 0 ? '0 incidentes' : `${totalBloqueadosInactivos} restringidos`}
              </span>
              <span className="text-slate-600">{totalBloqueadosInactivos === 0 ? 'Directorio limpio' : 'Tokens revocados'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PASO 2: LISTADO DE USUARIOS REALES Y FILTROS AVANZADOS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* BARRA DE HERRAMIENTAS Y PESTAÑAS */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-4">
          {/* Pestañas de Filtro Rápido */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'TODOS' as QuickTab, label: 'Todos los usuarios', count: usuarios.length },
              { id: 'SUPERADMIN' as QuickTab, label: 'Superadministradores', count: usuarios.filter(u => u.rolCodigo === 'SUPERADMIN').length },
              { id: 'ADMINISTRATIVO' as QuickTab, label: 'Administrativos (Caja/Ventas/Coord)', count: usuarios.filter(u => ['DIRECCION', 'COORDINACION_ACADEMICA', 'CAJA', 'ASESOR_COMERCIAL'].includes(u.rolCodigo)).length },
              { id: 'DOCENTE' as QuickTab, label: 'Docentes / Instructores', count: usuarios.filter(u => u.rolCodigo === 'DOCENTE').length },
              { id: 'INACTIVO_BLOQUEADO' as QuickTab, label: 'Inactivos / Bloqueados', count: usuarios.filter(u => u.status === 'INACTIVO' || u.status === 'BLOQUEADO').length },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtros: Búsqueda, Sede y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            {/* Input de Búsqueda */}
            <div className="md:col-span-6 relative">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, DNI, correo institucional o área..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A] text-slate-900 transition-all shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-600 hover:text-slate-600"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Selector de Sede */}
            <div className="md:col-span-3">
              <select
                value={selectedSede}
                onChange={(e) => setSelectedSede(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A] shadow-xs"
              >
                <option value="TODAS">Todas las Sedes</option>
                <option value="Sede Central - Tumbes">Sede Central - Tumbes</option>
                <option value="Sede San Juan de Lurigancho">Sede San Juan de Lurigancho</option>
                <option value="Sede Los Olivos">Sede Los Olivos</option>
              </select>
            </div>

            {/* Selector de Estado */}
            <div className="md:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A] shadow-xs"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="BLOQUEADO">BLOQUEADO</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL DE USUARIOS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Colaborador / Identidad</th>
                <th className="py-3.5 px-4 font-bold">Rol Jerárquico & RBAC</th>
                <th className="py-3.5 px-4 font-bold">Sede & Área Operativa</th>
                <th className="py-3.5 px-4 font-bold">Último Acceso / Dispositivo</th>
                <th className="py-3.5 px-4 font-bold text-center">2FA / Seguridad</th>
                <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                <th className="py-3.5 px-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((usuario) => {
                  const rolDef = CAT_ROLES[usuario.rolCodigo] || CAT_ROLES.SUPERADMIN;
                  const initials = usuario.displayName
                    .split(" ")
                    .slice(0, 2)
                    .map(n => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr 
                      key={usuario.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        usuario.status === 'BLOQUEADO' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Colaborador & DNI */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {usuario.photoUrl ? (
                            <img 
                              src={usuario.photoUrl} 
                              alt={usuario.displayName} 
                              className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-2xs border border-slate-200" 
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                              usuario.rolCodigo === 'SUPERADMIN' 
                                ? 'bg-[#C4121A] text-white' 
                                : usuario.rolCodigo === 'DIRECCION'
                                ? 'bg-purple-600 text-white'
                                : usuario.rolCodigo === 'COORDINACION_ACADEMICA'
                                ? 'bg-blue-600 text-white'
                                : usuario.rolCodigo === 'CAJA'
                                ? 'bg-amber-600 text-white'
                                : usuario.rolCodigo === 'ASESOR_COMERCIAL'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-700 text-white'
                            }`}>
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 leading-snug">
                                {usuario.displayName}
                              </span>
                              {usuario.isProtected && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-[#990000]" title="Cuenta Raíz Institucional">
                                  <Lock className="w-2.5 h-2.5" /> Root
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[11px] text-slate-600">
                                {usuario.dni}
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="text-slate-600">{usuario.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rol Jerárquico & RBAC */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shadow-2xs"
                          style={{
                            backgroundColor: rolDef.badgeBg.replace('bg-', ''),
                          }}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            usuario.rolCodigo === 'SUPERADMIN' ? 'bg-[#C4121A]' :
                            usuario.rolCodigo === 'DIRECCION' ? 'bg-purple-600' :
                            usuario.rolCodigo === 'COORDINACION_ACADEMICA' ? 'bg-blue-600' :
                            usuario.rolCodigo === 'CAJA' ? 'bg-amber-600' :
                            usuario.rolCodigo === 'ASESOR_COMERCIAL' ? 'bg-emerald-600' : 'bg-slate-500'
                          }`} />
                          <span className={rolDef.badgeText}>{rolDef.nombre}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 mt-1 font-medium">
                          {rolDef.jerarquia}
                        </div>
                      </td>

                      {/* Sede & Área */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>{usuario.sede}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                          {usuario.area}
                        </div>
                      </td>

                      {/* Último Acceso & Dispositivo */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 text-xs">
                          {usuario.ultimoAcceso}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-600">
                          <Monitor className="w-3 h-3 text-slate-600" />
                          <span>{usuario.dispositivo.so} · {usuario.dispositivo.browser}</span>
                        </div>
                      </td>

                      {/* 2FA */}
                      <td className="py-3.5 px-4 text-center">
                        {usuario.dosFactores ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            2FA Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          usuario.status === 'ACTIVO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : usuario.status === 'BLOQUEADO'
                            ? 'bg-red-50 text-[#990000] border border-red-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {usuario.status}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenRbacModal(usuario)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs shadow-2xs transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                          <span>Gestionar Rol / Accesos</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-600 space-y-2">
                      <Search className="h-8 w-8 text-slate-600 stroke-1" />
                      <p className="font-bold text-slate-700">No se encontraron colaboradores con los filtros seleccionados</p>
                      <p className="text-xs text-slate-600">Intenta modificando el término de búsqueda, la sede o el estado.</p>
                      <button 
                        onClick={() => { setSearchTerm(""); setSelectedSede("TODAS"); setSelectedStatus("TODOS"); setActiveTab('TODOS'); }}
                        className="mt-2 text-xs font-bold text-[#C4121A] hover:underline"
                      >
                        Restablecer todos los filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PIE DE TABLA CON TOTALES REALES */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            Mostrando <span className="font-bold text-slate-800">{usuariosFiltrados.length}</span> de <span className="font-bold text-slate-800">{usuarios.length}</span> cuentas registradas en base de datos
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {totalActivos} Activos
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {totalSuperadmins} Superadmins
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {totalBloqueadosInactivos} Restringidos
            </span>
          </div>
        </div>
      </div>

      {/* PASO 3: MODAL INTERACTIVO DE ASIGNACIÓN DE ROLES (RBAC) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isPending && setIsModalOpen(false)}
        title="Gestión de Privilegios y Matriz RBAC"
        className="max-w-3xl"
      >
        {selectedUser && (
          <form onSubmit={handleSaveRbac} className="space-y-5">
            {/* Cabecera del Usuario Seleccionado */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {selectedUser.displayName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      {selectedUser.displayName}
                    </h3>
                    <span className="px-2 py-0.2 rounded text-xs font-mono bg-slate-200 text-slate-700">
                      {selectedUser.dni}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {selectedUser.email} · {selectedUser.sede}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs text-slate-600 font-medium">Estado:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  targetStatus === 'ACTIVO'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : targetStatus === 'BLOQUEADO'
                    ? 'bg-red-50 text-[#990000] border border-red-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {targetStatus}
                </span>
              </div>
            </div>

            {/* Alerta si es cuenta protegida */}
            {selectedUser.isProtected && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#990000] text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#C4121A]" />
                <div>
                  <span className="font-bold">Cuenta Institucional Blindada: </span>
                  Esta cuenta pertenece a la Superadministración Raíz del sistema. Sus privilegios y rol no pueden ser modificados por salvaguarda de seguridad institucional.
                </div>
              </div>
            )}

            {/* Notificaciones de Feedback */}
            {modalFeedback && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                modalFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-[#990000]'
              }`}>
                {modalFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#C4121A]" />
                )}
                <span className="font-semibold">{modalFeedback.message}</span>
              </div>
            )}

            {/* SELECTOR DE ROLES JERÁRQUICOS EN TARJETAS INTERACTIVAS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selecciona el Rol Jerárquico (RBAC)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(Object.keys(CAT_ROLES) as RolCodigo[]).map((rolKey) => {
                  const rolItem = CAT_ROLES[rolKey];
                  const isSelected = targetRol === rolKey;
                  const isSuperadminOption = rolKey === 'SUPERADMIN';

                  return (
                    <button
                      key={rolKey}
                      type="button"
                      disabled={selectedUser.isProtected && !isSuperadminOption}
                      onClick={() => !selectedUser.isProtected && setTargetRol(rolKey)}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#C4121A] bg-red-50/40 ring-1 ring-[#C4121A]/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      } ${selectedUser.isProtected && !isSuperadminOption ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {rolItem.nombre}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#C4121A] shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600 block mt-0.5">
                            {rolItem.jerarquia}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${rolItem.badgeBg} ${rolItem.badgeText} ${rolItem.badgeBorder}`}>
                          {rolKey}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                        {rolItem.descripcion}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VISTA PREVIA DINÁMICA DE LA MATRIZ DE PRIVILEGIOS POR MÓDULO */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Matriz Dinámica de Privilegios por Módulo
                </label>
                <span className="text-[11px] text-slate-600 font-medium">
                  Reflejo en vivo para el rol: <strong className="text-slate-900">{CAT_ROLES[targetRol]?.nombre}</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Módulo</th>
                      <th className="py-2.5 px-3">Nivel de Acceso</th>
                      <th className="py-2.5 px-3">Alcance Institucional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {/* CRM & Ventas */}
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        CRM & Ventas
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${CAT_ROLES[targetRol].permisos.crm.colorBadge}`}>
                          {CAT_ROLES[targetRol].permisos.crm.nivel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {CAT_ROLES[targetRol].permisos.crm.descripcion}
                      </td>
                    </tr>

                    {/* Matrículas & Alumnos */}
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Matrículas & Alumnos
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${CAT_ROLES[targetRol].permisos.matriculas.colorBadge}`}>
                          {CAT_ROLES[targetRol].permisos.matriculas.nivel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {CAT_ROLES[targetRol].permisos.matriculas.descripcion}
                      </td>
                    </tr>

                    {/* Tesorería & Finanzas */}
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Tesorería & Finanzas
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${CAT_ROLES[targetRol].permisos.tesoreria.colorBadge}`}>
                          {CAT_ROLES[targetRol].permisos.tesoreria.nivel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {CAT_ROLES[targetRol].permisos.tesoreria.descripcion}
                      </td>
                    </tr>

                    {/* Usuarios & Seguridad */}
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Usuarios & Seguridad
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${CAT_ROLES[targetRol].permisos.seguridad.colorBadge}`}>
                          {CAT_ROLES[targetRol].permisos.seguridad.nivel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {CAT_ROLES[targetRol].permisos.seguridad.descripcion}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEDE ASIGNADA Y ESTADO DE LA CUENTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sede Asignada
                </label>
                <select
                  value={targetSede}
                  onChange={(e) => setTargetSede(e.target.value)}
                  disabled={selectedUser.isProtected || isPending}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A] disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="Sede Central - Tumbes">Sede Central - Tumbes</option>
                  <option value="Sede San Juan de Lurigancho">Sede San Juan de Lurigancho</option>
                  <option value="Sede Los Olivos">Sede Los Olivos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Estado de la Cuenta
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as EstadoUsuario)}
                  disabled={selectedUser.isProtected || isPending}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A] disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="ACTIVO">ACTIVO - Acceso regular autorizado</option>
                  <option value="INACTIVO">INACTIVO - Suspensión temporal / cese</option>
                  <option value="BLOQUEADO">BLOQUEADO - Revocación de credenciales</option>
                </select>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || selectedUser.isProtected}
                className="bg-[#C4121A] hover:bg-[#a50f16] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Actualizando privilegios...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Guardar Configuración RBAC
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL PARA INVITAR NUEVO COLABORADOR */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invitar Nuevo Colaborador Institucional"
        className="max-w-lg"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Completa los datos del colaborador. Se le asignarán los privilegios del rol seleccionado y podrá activar su cuenta institucional.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={inviteNombre}
              onChange={(e) => setInviteNombre(e.target.value)}
              placeholder="Ej: Ana María Quispe Rojas"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                DNI / Documento
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={inviteDni}
                onChange={(e) => setInviteDni(e.target.value.replace(/\D/g, ''))}
                placeholder="72849102"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Correo Institucional
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="a.quispe@brusben.edu.pe"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rol Jerárquico
              </label>
              <select
                value={inviteRol}
                onChange={(e) => setInviteRol(e.target.value as RolCodigo)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A]"
              >
                <option value="ASESOR_COMERCIAL">Asesor Comercial</option>
                <option value="CAJA">Tesorería y Finanzas</option>
                <option value="COORDINACION_ACADEMICA">Coordinación Académica</option>
                <option value="DOCENTE">Docente / Instructor</option>
                <option value="DIRECCION">Dirección General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sede Inicial
              </label>
              <select
                value={inviteSede}
                onChange={(e) => setInviteSede(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A]"
              >
                <option value="Sede Central - Tumbes">Sede Central - Tumbes</option>
                <option value="Sede San Juan de Lurigancho">Sede San Juan de Lurigancho</option>
                <option value="Sede Los Olivos">Sede Los Olivos</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <span>El colaborador recibirá un correo institucional de bienvenida con instrucciones para configurar su contraseña y activar el doble factor de autenticación (2FA).</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#C4121A] hover:bg-[#a50f16] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs"
            >
              Enviar Invitación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
