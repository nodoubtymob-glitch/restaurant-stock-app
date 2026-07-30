'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { dateTimeBR, num } from '@/lib/format'

interface Movement {
  id: string
  quantity_change: number
  movement_type: 'entrada' | 'saída'
  notes: string | null
  recorded_at: string
  product?: { name: string; unit?: { abbreviation: string | null } | null } | null
  recorded_by_profile?: { email: string } | null
}

type Filter = 'all' | 'entrada' | 'saída'

export default function HistoricoPage() {
  const supabase = createClient()
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('stock_movements')
        .select(
          'id,quantity_change,movement_type,notes,recorded_at,product:products(name,unit:units(abbreviation)),recorded_by_profile:profiles(email)'
        )
        .order('recorded_at', { ascending: false })
        .limit(150)
      setMovements((data as any as Movement[]) || [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () => movements.filter((m) => filter === 'all' || m.movement_type === filter),
    [movements, filter]
  )

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tudo' },
    { key: 'entrada', label: '📥 Entradas' },
    { key: 'saída', label: '📤 Saídas' },
  ]

  return (
    <div>
      <PageHeader title="Histórico" subtitle="Todas as movimentações de estoque" />

      <div className="mb-4 flex gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              filter === t.key
                ? 'bg-ember-soft text-ember-200 ring-1 ring-inset ring-ember-500/20'
                : 'bg-white/5 text-coal-100/50 hover:text-coal-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <FullSpinner label="Carregando histórico..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🧾" title="Nenhuma movimentação" description="As entradas e saídas aparecerão aqui." />
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const out = m.movement_type === 'saída'
            return (
              <div key={m.id} className="card flex items-center gap-3 p-3.5">
                <div
                  className={`stat-icon shrink-0 ${
                    out ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'
                  }`}
                >
                  {out ? '📤' : '📥'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {m.product?.name || 'Produto removido'}
                  </p>
                  <p className="truncate text-xs text-coal-100/45">
                    {dateTimeBR(m.recorded_at)}
                    {m.recorded_by_profile?.email
                      ? ` · ${m.recorded_by_profile.email}`
                      : ''}
                    {m.notes ? ` · ${m.notes}` : ''}
                  </p>
                </div>
                <div
                  className={`shrink-0 text-right font-bold ${
                    out ? 'text-red-300' : 'text-emerald-300'
                  }`}
                >
                  {out ? '−' : '+'}
                  {num(Math.abs(m.quantity_change))}
                  <span className="ml-1 text-xs font-normal text-coal-100/40">
                    {m.product?.unit?.abbreviation || ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
