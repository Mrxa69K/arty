import { Suspense } from 'react'
import SupportContent from './SupportContent'

export const metadata = {
  title: 'Contact support | ArtyDrop',
}

export default function SupportPage() {
  return (
    <Suspense fallback={null}>
      <SupportContent />
    </Suspense>
  )
}
