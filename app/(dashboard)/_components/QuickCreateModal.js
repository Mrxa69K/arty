'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

export function QuickCreateButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="h-9 px-4 text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-white/20"
      >
        <Plus className="w-4 h-4" />
        New gallery
      </Button>
      
      {open && <QuickCreateModal open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
