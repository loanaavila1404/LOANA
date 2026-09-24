import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default async function ErpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // TODO: Fetch user profile and permissions from DB
  const user = {
    name: session.user.user_metadata?.full_name || session.user.email || 'Usuario',
    email: session.user.email || '',
    role: 'SUPERADMIN', // Fallback for now
    photoUrl: session.user.user_metadata?.avatar_url || '',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-[260px] md:flex-col">
        <Sidebar userRole={user.role} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Topbar user={user} />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
