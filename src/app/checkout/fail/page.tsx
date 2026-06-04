import Link from 'next/link'
import { XCircle, RefreshCw } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Оплата не прошла — Tournable',
}

export default function CheckoutFailPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fff5f5 50%, #ffffff 100%)' }}
    >
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Оплата не прошла</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Платёж был отменён или завершился с ошибкой. Средства не списаны.
            Попробуйте снова или воспользуйтесь другой картой.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors"
          >
            Вернуться к турнирам
          </Link>
        </div>

      </div>
    </div>
  )
}
