'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { toast } from 'sonner'
import { Loader2, Instagram, Globe, Facebook, Save, User, Link2 } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    contact_email: '',
    website_url: '',
    instagram_url: '',
    tiktok_url: '',
    facebook_url: '',
  })

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, bio, contact_email, website_url, instagram_url, tiktok_url, facebook_url')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data) {
        setForm({
          full_name: data.full_name || '',
          bio: data.bio || '',
          contact_email: data.contact_email || '',
          website_url: data.website_url || '',
          instagram_url: data.instagram_url || '',
          tiktok_url: data.tiktok_url || '',
          facebook_url: data.facebook_url || '',
        })
      }
    } catch (err) {
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim() || null,
          bio: form.bio.trim() || null,
          contact_email: form.contact_email.trim() || null,
          website_url: normalizeUrl(form.website_url),
          instagram_url: normalizeInstagram(form.instagram_url),
          tiktok_url: normalizeTiktok(form.tiktok_url),
          facebook_url: normalizeUrl(form.facebook_url),
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profile saved')
    } catch (err) {
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const normalizeUrl = (url) => {
    if (!url || !url.trim()) return null
    const u = url.trim()
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `https://${u}`
  }

  const normalizeInstagram = (val) => {
    if (!val || !val.trim()) return null
    const handle = val.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')
    return `https://instagram.com/${handle}`
  }

  const normalizeTiktok = (val) => {
    if (!val || !val.trim()) return null
    const handle = val.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, '').replace(/\/$/, '')
    return `https://tiktok.com/@${handle}`
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" strokeWidth={1} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 font-body mb-2">Settings</p>
        <h1 className="font-display text-3xl text-white">Your Profile</h1>
        <p className="text-sm text-white/40 font-body mt-2">
          This information appears on your client galleries.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-10">

        {/* ── Identity ── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <User className="w-3.5 h-3.5 text-white/25" strokeWidth={1.5} />
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 font-body">Identity</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-xs text-white/40 font-body mb-2">Display name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="Your name or studio name"
                maxLength={80}
                className="w-full h-11 bg-white/[0.03] border border-white/8 px-4 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-white/20 transition-colors rounded-sm"
              />
              <p className="text-[11px] text-white/20 font-body mt-1.5">Shown as the photographer name on your galleries</p>
            </div>
            <div>
              <label className="block text-xs text-white/40 font-body mb-2">Bio / Tagline</label>
              <textarea
                value={form.bio}
                onChange={set('bio')}
                placeholder="e.g. Portrait & wedding photographer based in Paris"
                maxLength={200}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/8 px-4 py-3 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-white/20 transition-colors rounded-sm resize-none"
              />
              <p className="text-[11px] text-white/20 font-body mt-1.5">{form.bio.length}/200 characters</p>
            </div>
            <div>
              <label className="block text-xs text-white/40 font-body mb-2">Contact email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={set('contact_email')}
                placeholder="hello@yourstudio.com"
                className="w-full h-11 bg-white/[0.03] border border-white/8 px-4 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-white/20 transition-colors rounded-sm"
              />
              <p className="text-[11px] text-white/20 font-body mt-1.5">Clients can reach you at this address</p>
            </div>
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Online presence ── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Link2 className="w-3.5 h-3.5 text-white/25" strokeWidth={1.5} />
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 font-body">Online presence</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-xs text-white/40 font-body mb-2">Website / Booking page</label>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-white/20 flex-shrink-0" strokeWidth={1.5} />
                <input
                  type="text"
                  value={form.website_url}
                  onChange={set('website_url')}
                  placeholder="yoursite.com"
                  className="flex-1 h-11 bg-white/[0.03] border border-white/8 px-4 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-white/20 transition-colors rounded-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 font-body mb-2">Instagram</label>
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-white/20 flex-shrink-0" strokeWidth={1.5} />
                <input
                  type="text"
                  value={form.instagram_url}
                  onChange={set('instagram_url')}
                  placeholder="@yourhandle or instagram.com/yourhandle"
                  className="flex-1 h-11 bg-white/[0.03] border border-white/8 px-4 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-white/20 transition-colors rounded-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 font-body mb-2">TikTok</label>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white/20 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
                </svg>
                <input
                  type="text"
                  value={form.tiktok_url}
                  onChange={set('tiktok_url')}
                  placeholder="@yourhandle"
                  className="flex-1 h-11 bg-white/[0.03] border border-white/8 px-4 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-white/20 transition-colors rounded-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 font-body mb-2">Facebook</label>
              <div className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-white/20 flex-shrink-0" strokeWidth={1.5} />
                <input
                  type="text"
                  value={form.facebook_url}
                  onChange={set('facebook_url')}
                  placeholder="facebook.com/yourpage"
                  className="flex-1 h-11 bg-white/[0.03] border border-white/8 px-4 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-white/20 transition-colors rounded-sm"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Account info ── */}
        <section>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 font-body mb-6">Account</p>
          <div className="px-4 py-4 bg-white/[0.02] border border-white/5 rounded-sm">
            <p className="text-xs text-white/30 font-body mb-0.5">Logged in as</p>
            <p className="text-sm text-white/60 font-body">{user?.email}</p>
          </div>
        </section>

        {/* ── Save ── */}
        <div className="pt-2 pb-8">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2.5 h-11 px-7 bg-gold text-black text-sm font-body font-semibold hover:bg-gold-light transition-colors rounded-sm disabled:opacity-50"
          >
            {isSaving
              ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              : <Save className="w-4 h-4" strokeWidth={2} />
            }
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
        </div>

      </form>
    </div>
  )
}
