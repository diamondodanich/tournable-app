'use client'

import { useState } from 'react'
import { deleteTournament } from '@/app/actions/tournaments'
import { Trash2 } from 'lucide-react'

export default function DeleteTournamentButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
        title="Удалить турнир"
      >
        <Trash2 size={13} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-black text-gray-900 text-lg mb-1">Удалить турнир?</p>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              «{name}» будет удалён безвозвратно — все команды, матчи и статистика исчезнут.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <form action={deleteTournament.bind(null, id)} className="flex-1" onSubmit={() => setDeleting(true)}>
                <button
                  type="submit"
                  disabled={deleting}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Удаляем…' : 'Да, удалить'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
