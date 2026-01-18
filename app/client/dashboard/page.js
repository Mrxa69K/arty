'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { Loader2, ArrowUpRight, Image as ImageIcon, User, Settings, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'

export default function ClientDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [sharedGalleries, setSharedGalleries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    if (!user) return
    
    checkUserType()
    fetchSharedGalleries()
  }, [user])

  const checkUserType = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_type, full_name')
      .eq('id', user.id)
      .single()

    setUserProfile(data)

    if (data?.user_type === 'photographer') {
      router.push('/dashboard')
    }
  }

  const fetchSharedGalleries = async () => {
    try {
      setSharedGalleries([])
    } catch (error) {
      console.error('Error fetching galleries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EA]">
        <Loader2 className="w-8 h-8 animate-spin text-black/20" />
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: "url('/cover.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 bg-[#F5F0EA]/80" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 min-h-screen">
        {/* Header with Profile Menu */}
        <header className="pt-8 px-6 sm:px-12 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/" className="group">
              <span className="text-2xl font-serif text-black/90 tracking-tight group-hover:text-black transition-colors">
                Artydrop
              </span>
            </Link>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-sm border border-black/10 flex items-center justify-center transition-all duration-300 hover:scale-105">
                  <User className="w-5 h-5 text-black/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-xl border-black/10 rounded-2xl p-2">
                <div className="px-3 py-2 mb-2">
                  <p className="text-sm font-medium text-black/90">
                    {userProfile?.full_name || 'Client'}
                  </p>
                  <p className="text-xs text-black/50">
                    {user?.email}
                  </p>
                </div>
                
                <DropdownMenuSeparator className="bg-black/10" />
                
                <DropdownMenuItem 
                  onClick={() => router.push('/client/profile')}
                  className="rounded-xl cursor-pointer hover:bg-black/5 transition-colors"
                >
                  <User className="w-4 h-4 mr-2 text-black/50" />
                  <span className="text-sm">Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => router.push('/client/settings')}
                  className="rounded-xl cursor-pointer hover:bg-black/5 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2 text-black/50" />
                  <span className="text-sm">Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-black/10" />
                
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="rounded-xl cursor-pointer hover:bg-red-50 transition-colors text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="text-sm">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <section className="py-12 sm:py-20 px-6 sm:px-12 max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl sm:text-6xl font-serif text-black/90 mb-4">
              Your galleries
            </h1>
            <p className="text-sm text-black/60">
              View photos shared with you by photographers
            </p>
          </div>

          {/* Empty state */}
          {sharedGalleries.length === 0 && (
            <div className="text-center py-20">
              <div className="space-y-4 max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-10 h-10 text-black/20" />
                </div>
                <h3 className="text-2xl font-serif text-black/90">
                  No galleries yet
                </h3>
                <p className="text-sm text-black/50 leading-relaxed">
                  When a photographer shares a gallery with you, it will appear here. 
                  You'll receive an email notification with the link.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
