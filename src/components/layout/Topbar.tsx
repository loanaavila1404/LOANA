'use client'

import { Bell, Search, User } from 'lucide-react'
import Link from 'next/link'

interface TopbarProps {
  user: {
    name: string
    email: string
    role: string
    photoUrl: string
  }
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-graphite-400" />
          <input 
            type="text" 
            placeholder="Buscar estudiantes, recibos o matrículas..." 
            className="w-full pl-10 pr-4 h-[38px] bg-canvas border-none rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-graphite-400 hover:text-graphite-700 relative rounded-full hover:bg-canvas transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-border"></div>

        <Link href="/perfil" className="flex items-center gap-3 hover:bg-canvas p-1.5 rounded-md transition-colors">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-graphite-900 leading-none">{user.name}</p>
            <p className="text-xs text-graphite-500 mt-1">{user.role}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary-light flex items-center justify-center text-primary border border-primary/20 overflow-hidden">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}
