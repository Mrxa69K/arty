'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

export function PlanBanner() {
  const [plan, setPlan] = useState(null)
  
  return (
    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs border-white/20">
      Trial • Upgrade →
    </Badge>
  )
}
