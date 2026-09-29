'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function NotificationBell({ userId }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, link_url, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (userId) fetchNotifications()
  }, [userId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = () => {
    setOpen((v) => !v)
    if (!open) fetchNotifications()
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
      )
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notification.id)
    }
    setOpen(false)
    if (notification.link_url) router.push(notification.link_url)
  }

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id)
    if (unreadIds.length === 0) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative h-10 w-10 flex items-center justify-center rounded-sm hover:bg-white/5 transition-colors"
        data-testid="notification-bell"
      >
        <Bell className="w-4.5 h-4.5 text-white/60" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#7AB8CB] text-[10px] font-bold text-black leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-sm bg-[#121212] border border-white/10 shadow-dark-xl py-2 z-50 animate-scaleIn origin-top-right">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <p className="text-sm font-body font-medium text-white">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-white/40 hover:text-white font-body transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-white/30 font-body px-4 py-6 text-center">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-white/30 font-body px-4 py-6 text-center">No notifications yet.</p>
          ) : (
            <div className="py-1">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-start gap-2.5 ${
                    !n.read_at ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  {!n.read_at && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7AB8CB] mt-1.5 flex-shrink-0" />
                  )}
                  <div className={n.read_at ? 'pl-4' : ''}>
                    <p className="text-sm text-white font-body">{n.title}</p>
                    {n.body && <p className="text-xs text-white/40 font-body mt-0.5">{n.body}</p>}
                    <p className="text-[11px] text-white/25 font-body mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
