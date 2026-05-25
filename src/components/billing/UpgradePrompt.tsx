'use client'

import { X, Zap, Lock } from 'lucide-react'

const PRO_FEATURES = [
  'Форматы Группы + Плей-офф и Лига + Плей-офф',
  'LIVE-режим с таймером и прямым эфиром',
  'Экспорт отчётов в PDF и PNG',
  'До 64 команд в одном турнире',
  'Неограниченное количество турниров',
]

interface Props {
  featureName?: string
  onClose: () => void
}

export default function UpgradePrompt({ featureName, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-black text-gray-900 text-lg mb-1">
            {featureName ? `${featureName} — Pro` : 'Функция доступна на Pro'}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Перейдите на Pro, чтобы разблокировать эту и другие возможности:
          </p>
        </div>

        {/* Feature list */}
        <ul className="space-y-2">
          {PRO_FEATURES.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
              <Zap size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Закрыть
          </button>
          <a
            href="/checkout"
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors text-center"
          >
            Перейти на Pro
          </a>
        </div>
      </div>
    </div>
  )
}
