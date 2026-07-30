'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import DateRange from '@/components/ui/DateRange'
import { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { dateTimeBR, num, daysAgoISO, todayISO } from '@/lib/format'

interface Movement {
  id: string
  quantity_change: number
  movement_type: 'entrada' | 'saída'
  notes: string | null
  recorded_at: string
  product_id: string
  product?: { name: string; unit?: { abbreviation: string | null } | null } | null
  recorded_by_profile?: { email: string } | null
}

type TypeFilter = 'all' | 'entrada' | 'saída'

export default function HistoricoPage() {
  const supabase = createClient()
  const [movements, setMovements] = useState<Movement[]>([])
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<TypeFilter>('all')
  const [productId, setProductId] = useState<string>('all')
  const [start, setStart] = useState(daysAgoISO(6))
  const [end, setEnd] = useState(todayISO())

  // Load product list once for the filter dropdown.
  useEffect(() => {
    supabase
      .from('products')
      .select('id,name')
      .order('name')
      .then(({ data }) => setProducts((data as any) || []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('stock_movements')
        .select(
          'id,quantity_change,movement_type,notes,recorded_at,product_id,product:products(name,unit:units(abbreviation)),recorded_by_profile:profiles(email)'
        )
        .gte('recorded_at', start + 'T00:00:00')
        .lte('recorded_at', end + 'T23:59:59')
        .order('recorded_at', { ascending: false })
        .limit(500)
      setMovements((data as any as Movement[]) || [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end])

  // Product filter drives both totals and the list.
  const byProduct = useMemo(
    () =>
      productId === 'all'
        ? movements
        : movements.filter((m) => m.product_id === productId),
    [movements, productId]
  )

  const totals = useMemo(() => {
    let entrada = 0
    let saida = 0
    for (const m of byProduct) {
      if (m.movement_type === 'entrada') entrada += Math.abs(m.quantity_change)
      else saida += Math.abs(m.quantity_change)
    }
    return { entrada, saida }
  }, [byProduct])

  const filtered = useMemo(
    () => byProduct.filter((m) => type === 'all' || m.movement_type === type),
    [byProduct, type]
  )

  const typeTabs: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'Tudo' },
    { key: 'entrada', label: '📥 Entradas' },
    { key: 'saída', label: '📤 Saídas' },
  ]

  const selectedProduct = products.find((p) => p.id === productId)

  return (
    <div>
      <PageHeader title="Histórico" subtitle="Movimentações por período e produto" />

      {/* Filters */}
      <div className="card mb-4 space-y-3 p-4">
        <DateRange
          start={start}
          end={end}
          onChange={(s, e) => {
            setStart(s)
            setEnd(e)
          }}
        />
        <div>
          <label className="label">Produto</label>
          <select
            className="field"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="all">Todos os produtos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Totals for the current filter */}
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="card flex items-center gap-3 p-3.5">
          <div className="stat-icon bg-emerald-500/15 text-emerald-700">📥</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-coal-400">Entrou</p>
            <p className="font-display text-xl font-bold">{num(totals.entrada)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-3.5">
          <div className="stat-icon bg-red-500/[0.12] text-red-600">📤</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-coal-400">
              Saiu / vendido
            </p>
            <p className="font-display text-xl font-bold">{num(totals.saida)}</p>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <p className="mb-4 rounded-2xl bg-black/[0.04] px-4 py-2.5 text-sm font-medium text-coal-300">
          <b className="text-coal-100">{selectedProduct.name}</b> — saíram{' '}
          <b className="text-coal-100">{num(totals.saida)}</b> no período selecionado.
        </p>
      )}

      {/* Type filter */}
      <div className="mb-4 flex gap-1.5">
        {typeTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
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
          title="Nada neste filtro"
          description="Troque o período, o produto ou o tipo acima."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const out = m.movement_type === 'saída'
            return (
              <div key={m.id} className="card flex items-center gap-3 p-3.5">
                <div
                  className={`stat-icon shrink-0 ${
                    out ? 'bg-red-500/[0.12] text-red-600' : 'bg-emerald-500/15 text-emerald-700'
                  }`}
                >
                  {out ? '📤' : '📥'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
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
                    out ? 'text-red-600' : 'text-emerald-700'
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
