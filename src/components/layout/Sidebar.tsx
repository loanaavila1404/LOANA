import Link from 'next/link'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CreditCard,
  Settings,
  ShieldCheck,
  BarChart3,
  UserCircle
} from 'lucide-react'
import { APP_CONFIG } from '@/lib/constants/config'

interface SidebarProps {
  userRole: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  // TODO: Implement proper RBAC for menu items
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'CRM Comercial', href: '/crm', icon: Users },
    { name: 'Estudiantes', href: '/personas', icon: UserCircle },
    { name: 'Oferta Académica', href: '/oferta', icon: BookOpen },
    { name: 'Matrículas y Pagos', href: '/matriculas', icon: CreditCard },
    { name: 'Reportes', href: '/reportes', icon: BarChart3 },
    { name: 'Usuarios y Accesos', href: '/usuarios', icon: ShieldCheck },
    { name: 'Auditoría', href: '/auditoria', icon: Settings },
  ]

  return (
    <div className="flex flex-col h-full bg-graphite-900 text-white border-r border-graphite-800">
      <div className="h-16 flex items-center px-6 bg-white shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="/logo.jpg" 
            alt="Logo" 
            width={150} 
            height={40} 
            className="object-contain"
            priority
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-graphite-300 hover:text-white hover:bg-graphite-800 group transition-colors"
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-graphite-400 group-hover:text-white" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-graphite-800">
        <div className="text-xs text-graphite-400 text-center">
          v{APP_CONFIG.VERSION}
        </div>
      </div>
    </div>
  )
}
