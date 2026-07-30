'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { dateTimeBR, num, daysAgoISO, todayISO } from '@/lib/format'

interface Movement {
  id: string
  quantity_change: number
  movement_type: 'entrada' | 'saída'
  notes: string | null
  recorded_at: string
  product?: { name: string; unit?: { abbreviation: string | null } | null } | null
  recorded_by_profile?: { email: string } | null
}

type TypeFilter = 'all' | 'entrada' | 'saída'
type Period = 'today' | 'week' | 'month' | 'all'

const PERIODS: { key: Period; label: string; days: number | null }[] = [
  { key: 'today', label: 'Hoje', days: 0 },
  { key: 'week', label: 'Semana', days: 6 },
  { key: 'month', label: 'Mês', days: 29 },
  { key: 'all', label: 'Tudo', days: null },
]

export default function HistoricoPage() {
  const supabase = createClient()
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<TypeFilter>('all')
  const [period, setPeriod] = useState<Period>('week')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const days = PERIODS.find((p) => p.key === period)!.days
      let query = supabase
        .from('stock_movements')
        .select(
          'id,quantity_change,movement_type,notes,recorded_at,product:products(name,unit:units(abbreviation)),recorded_by_profile:profiles(email)'
        )
        .order('recorded_at', { ascending: false })
        .limit(300)
      if (days !== null) {
        query = query.gte('recorded_at', daysAgoISO(days) + 'T00:00:00')
      }
      const { data } = await query
      setMovements((data as any as Movement[]) || [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  // Totals for the whole period (both types), independent of the type tab.
  const totals = useMemo(() => {
    let entrada = 0
    let saida = 0
    for (const m of movements) {
      if (m.movement_type === 'entrada') entrada += Math.abs(m.quantity_change)
      else saida += Math.abs(m.quantity_change)
    }
    return { entrada, saida }
  }, [movements])

  const filtered = useMemo(
    () => movements.filter((m) => type === 'all' || m.movement_type === type),
    [movements, type]
  )

  const typeTabs: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'Tudo' },
    { key: 'entrada', label: '📥 Entradas' },
    { key: 'saída', label: '📤 Saídas' },
  ]

  return (
    <div>
      <PageHeader title="Histórico" subtitle="Movimentações por período" />

      {/* Period filter */}
      <div className="mb-3 inline-flex rounded-xl bg-black/[0.05] p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
              period === p.key ? 'bg-ember text-coal-50 shadow-glow-sm' : 'text-coal-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Totals for the period */}
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="card flex items-center gap-3 p-3.5">
          <div className="stat-icon bg-emerald-500/15 text-emerald-600">📥</div>
          <div>
            <p className="text-xs uppercase tracking-wide text-coal-400">Entradas</p>
            <p className="text-xl font-extrabold">{num(totals.entrada)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-3.5">
          <div className="stat-icon bg-red-500/15 text-red-600">📤</div>
          <div>
            <p className="text-xs uppercase tracking-wide text-coal-400">Saídas</p>
            <p className="text-xl font-extrabold">{num(totals.saida)}</p>
          </div>
        </div>
      </div>

      {/* Type filter */}
      <div className="mb-4 flex gap-1.5">
        {typeTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              type === t.key
                ? 'bg-ember-soft text-ember-700 ring-1 ring-inset ring-ember-500/20'
                : 'bg-black/[0.05] text-coal-400 hover:text-coal-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <FullSpinner label="Carregando histórico..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="Nada neste período"
          description="Troque o filtro acima ou registre uma movimentação."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const out = m.movement_type === 'saída'
            return (
              <div key={m.id} className="card flex items-center gap-3 p-3.5">
                <div
                  className={`stat-icon shrink-0 ${
                    out ? 'bg-red-500/15 text-red-600' : 'bg-emerald-500/15 text-emerald-600'
                  }`}
                >
                  {out ? '📤' : '📥'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {m.product?.name || 'Produto removido'}
                  </p>
                  <p className="truncate text-xs text-coal-400">
                    {dateTimeBR(m.recorded_at)}
                    {m.recorded_by_profile?.email ? ` · ${m.recorded_by_profile.email}` : ''}
                    {m.notes ? ` · ${m.notes}` : ''}
                  </p>
                </div>
                <div
                  className={`shrink-0 text-right font-bold ${
                    out ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {out ? '−' : '+'}
                  {num(Math.abs(m.quantity_change))}
                  <span className="ml-1 text-xs font-normal text-coal-400">
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
