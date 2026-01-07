'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Camera,
  LayoutDashboard,
  Images,
  LogOut,
  Plus,
  Menu,
  X,
} from 'lucide-react'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        setIsLoading(false)
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-b-transparent animate-spin" />
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/galleries', label: 'Galleries', icon: Images },
    // future sections:
    // { href: '/dashboard/clients', label: 'Clients', icon: Users },
    // { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const getInitials = (email) => email?.substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#F97316] flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span
                className="text-sm font-semibold tracking-tight hidden sm:inline"
                style={{ fontFamily: '"Josefin Sans", system-ui, sans-serif' }}
              >
                Artydrop
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-2 text-xs ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard/galleries/new" className="hidden sm:block">
                <Button className="gap-2 h-9 px-4 text-xs bg-white text-black hover:bg-white/90">
                  <Plus className="w-4 h-4" />
                  New gallery
                </Button>
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#F97316] text-xs text-white">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-black/95 border border-white/10 shadow-xl py-2 z-50">
                    <div className="px-3 pb-2 border-b border-white/10">
                      <p className="text-xs font-medium">
                        {user?.user_metadata?.full_name || 'Photographer'}
                      </p>
                      <p className="text-[11px] text-white/50 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left text-xs text-red-400 flex items-center gap-2 px-3 py-2.5 hover:bg-white/5"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-black/95">
            <nav className="max-w-6xl mx-auto px-4 py-3 space-y-1 text-sm">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                )
              })}
              <Link
                href="/dashboard/galleries/new"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="mt-2 px-3 py-2 rounded-lg bg-white text-black text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New gallery
                </div>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
