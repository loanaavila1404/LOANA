'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { MobileDrawer } from './MobileDrawer'

export function AppLayout({ children, user }: { children: React.ReactNode; user: any }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
        user={user}
      />

      {/* Main Viewport Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-14 md:pb-0">
        <Topbar 
          user={user} 
          onOpenSidebar={() => setIsMobileSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto px-3.5 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
    </div>
  )
}
