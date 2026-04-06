'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Images,
  LogOut,
  Plus,
  Menu,
  X,
  Settings,
  ChevronDown
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-b-transparent animate-spin" />
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/galleries', label: 'Galleries', icon: Images },
  ]

  const getInitials = (email) => email?.substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3" data-testid="dashboard-logo">
              <span className="font-display text-xl tracking-tight text-white/90">
                ArtyDrop
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
                      className={`gap-2 text-sm font-body rounded-sm ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard/galleries/new" className="hidden sm:block">
                <Button 
                  className="gap-2 h-10 px-5 bg-gold text-black hover:bg-gold-light rounded-sm font-body text-sm font-medium"
                  data-testid="new-gallery-btn"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  New gallery
                </Button>
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="h-10 flex items-center gap-2 px-3 rounded-sm hover:bg-white/5 transition-colors"
                  data-testid="user-menu-btn"
                >
                  <Avatar className="h-8 w-8 rounded-sm">
                    <AvatarFallback className="bg-gold/20 text-gold text-xs font-body font-medium rounded-sm">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className={`w-4 h-4 text-white/40 hidden sm:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-sm bg-[#121212] border border-white/10 shadow-dark-xl py-2 z-50 animate-scaleIn origin-top-right">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-body font-medium text-white">
                        {user?.user_metadata?.full_name || 'Photographer'}
                      </p>
                      <p className="text-xs text-white/40 font-body truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-2">
                      <Link href="/dashboard/settings">
                        <button className="w-full text-left text-sm text-white/60 font-body flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 hover:text-white transition-colors">
                          <Settings className="w-4 h-4" strokeWidth={1.5} />
                          Settings
                        </button>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left text-sm text-red-400/80 font-body flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 hover:text-red-400 transition-colors"
                        data-testid="signout-btn"
                      >
                        <LogOut className="w-4 h-4" strokeWidth={1.5} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10 rounded-sm hover:bg-white/5"
                onClick={() => setMobileMenuOpen((v) => !v)}
                data-testid="mobile-menu-btn"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" strokeWidth={1.5} />
                ) : (
                  <Menu className="w-5 h-5" strokeWidth={1.5} />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a0a0a]">
            <nav className="px-6 py-4 space-y-2">
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-sm font-body text-sm ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                      {item.label}
                    </div>
                  </Link>
                )
              })}
              <Link
                href="/dashboard/galleries/new"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-sm bg-gold text-black font-body text-sm font-medium">
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  New gallery
                </div>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
