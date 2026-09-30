'use client'

import Link from 'next/link'

export default function LegalLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#ededed]">
      <header className="border-b border-white/5 px-8 md:px-16 h-14 flex items-center justify-between">
        <Link href="/" className="font-display text-white/50 hover:text-white text-sm tracking-wide transition-colors">
          ArtyDrop
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/legal/terms" className="text-[10px] tracking-[0.25em] uppercase text-white/20 hover:text-white/50 font-body transition-colors">
            Terms
          </Link>
          <Link href="/legal/privacy" className="text-[10px] tracking-[0.25em] uppercase text-white/20 hover:text-white/50 font-body transition-colors">
            Privacy
          </Link>
          <Link href="/legal/mentions-legales" className="text-[10px] tracking-[0.25em] uppercase text-white/20 hover:text-white/50 font-body transition-colors">
            Legal Notice
          </Link>
        </nav>
      </header>
      <main className="px-8 md:px-16 py-16 max-w-3xl mx-auto">
        {children}
      </main>
      <footer className="border-t border-white/5 px-8 md:px-16 py-8 text-center space-y-3">
        <button
          onClick={() => window.dispatchEvent(new Event('open-cookie-preferences'))}
          className="text-[9px] tracking-[0.3em] uppercase text-white/20 hover:text-white/50 font-body transition-colors"
        >
          Cookie preferences
        </button>
        <p className="text-[9px] tracking-[0.3em] uppercase text-white/15 font-body">ArtyDrop © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
