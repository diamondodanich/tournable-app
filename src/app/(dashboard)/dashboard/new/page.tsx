'use client'

import { useState } from 'react'
import { createTournament } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewTournamentPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [rounds, setRounds] = useState<string>('2')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('num_rounds', rounds)

    const result = await createTournament(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={16} /> Назад к турнирам
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Новый турнир</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Название турнира</Label>
              <Input
                id="name"
                name="name"
                placeholder="например: Кубок Компании 2026"
                maxLength={40}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Количество кругов</Label>
              <Select value={rounds} onValueChange={(v) => setRounds(v ?? '2')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 круг (однокруговой)</SelectItem>
                  <SelectItem value="2">2 круга (дома и в гостях)</SelectItem>
                  <SelectItem value="3">3 круга</SelectItem>
                  <SelectItem value="4">4 круга</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? 'Создаём…' : 'Создать турнир'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
