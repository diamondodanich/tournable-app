'use client'

import { Printer } from 'lucide-react'

export default function PrintButton({ label }: { label: string }) {
  return (
    <button onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
      <Printer size={15} /> {label}
    </button>
  )
}
