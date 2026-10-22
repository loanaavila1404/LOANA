'use client'
import { SessionUser } from '@/lib/types'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { MobileDrawer } from './MobileDrawer'

import { SedeContextType } from '@/lib/types'

export function AppLayout({
  children,
  user,
  appVersion = '1.0.0',
  sedeContext
}: {
  children: React.ReactNode;
  user: SessionUser;
  appVersion?: string;
  sedeContext?: SedeContextType;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas print:block print:h-auto print:min-h-0 print:overflow-visible print:bg-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0 z-30 print:hidden no-print">
        <Sidebar appVersion={appVersion} user={user} />
      </div>

      <MobileDrawer 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
        user={user}
        appVersion={appVersion}
      />

      {/* Main Viewport Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-14 md:pb-0 print:block print:h-auto print:min-h-0 print:overflow-visible print:p-0 print:pb-0 print:m-0 print:bg-white">
        <Topbar 
          user={user} 
          onOpenSidebar={() => setIsMobileSidebarOpen(true)} 
          sedeContext={sedeContext}
        />
        
        <main className="flex-1 overflow-y-auto px-3.5 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 print:block print:h-auto print:min-h-0 print:overflow-visible print:p-0 print:pb-0 print:m-0 print:bg-white print:space-y-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
    </div>
  )
}
