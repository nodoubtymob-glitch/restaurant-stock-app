'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { FullSpinner } from '@/components/ui/Spinner'
import { Revenue } from '@/lib/types'
import { brl, num, daysAgoISO, todayISO } from '@/lib/format'

interface StockItem {
  id: string
  name: string
  current_quantity: number
  low_stock_threshold: number
  unit?: { abbreviation: string | null } | null
}

interface DayBar {
  label: string
  value: number
}

const PERIODS = [
  { key: 'today', label: 'Hoje', days: 0 },
  { key: '7d', label: '7 dias', days: 6 },
  { key: '30d', label: '30 dias', days: 29 },
] as const

export default function DashboardPage() {
  const supabase = createClient()
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['key']>('7d')
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState<Revenue | null>(null)
  const [outItems, setOutItems] = useState<StockItem[]>([])
  const [lowItems, setLowItems] = useState<StockItem[]>([])
  const [bars, setBars] = useState<DayBar[]>([])
  const [productCount, setProductCount] = useState(0)
  const [showAlert, setShowAlert] = useState(false)
  const alertedRef = useRef(false)

  useEffect(() => {
    const days = PERIODS.find((p) => p.key === period)!.days
    const start = daysAgoISO(days)
    const end = todayISO()

    const load = async () => {
      setLoading(true)

      const [rev, prods, moves, count] = await Promise.all([
        supabase.rpc('calculate_revenue', { start_date: start, end_date: end }),
        supabase
          .from('products')
          .select('id,name,current_quantity,low_stock_threshold,unit:units(abbreviation)'),
        supabase
          .from('stock_movements')
          .select('quantity_change,recorded_at,product_id,movement_type')
          .eq('movement_type', 'saída')
          .gte('recorded_at', start + 'T00:00:00')
          .order('recorded_at'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
      ])

      const r = (rev.data as Revenue[] | null)?.[0]
      setRevenue(
        r || {
          faturamento_bruto: 0,
          faturamento_liquido: 0,
          total_quantidade_vendida: 0,
          total_custo_vendido: 0,
        }
      )

      const allProducts = (prods.data as any as StockItem[]) || []
      const out = allProducts
        .filter((p) => p.current_quantity <= 0)
        .sort((a, b) => a.name.localeCompare(b.name))
      const low = allProducts
        .filter((p) => p.current_quantity > 0 && p.current_quantity <= p.low_stock_threshold)
        .sort((a, b) => a.current_quantity - b.current_quantity)
      setOutItems(out)
      setLowItems(low)
      setProductCount(count.count || 0)

      // Show the alert popup once per visit when there's something wrong.
      if (!alertedRef.current && out.length + low.length > 0) {
        setShowAlert(true)
        alertedRef.current = true
      }

      // Daily sales bars
      const { data: pricing } = await supabase
        .from('product_pricing')
        .select('product_id,sale_price')
      const priceMap = new Map<string, number>()
      ;(pricing || []).forEach((p: any) => priceMap.set(p.product_id, p.sale_price))

      const dayCount = days + 1
      const buckets = new Map<string, number>()
      for (let i = 0; i < dayCount; i++) buckets.set(daysAgoISO(days - i), 0)
      ;(moves.data as any[] | null)?.forEach((m) => {
        const day = m.recorded_at.slice(0, 10)
        if (!buckets.has(day)) return
        const price = priceMap.get(m.product_id) || 0
        buckets.set(day, (buckets.get(day) || 0) + price * Math.abs(m.quantity_change))
      })
      setBars(
        Array.from(buckets.entries()).map(([day, value]) => ({
          label: day.slice(8, 10) + '/' + day.slice(5, 7),
          value,
        }))
      )

      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const maxBar = Math.max(1, ...bars.map((b) => b.value))
  const alertCount = outItems.length + lowItems.length

  return (
    <div>
      <PageHeader
        title="Painel"
        subtitle="Visão geral do seu negócio"
        action={
          alertCount > 0 ? (
            <button className="btn-ghost" onClick={() => setShowAlert(true)}>
              🔔 <span className="badge-red ml-1">{alertCount}</span>
            </button>
          ) : undefined
        }
      />

      {/* Period selector */}
      <div className="mb-4 inline-flex rounded-xl bg-black/[0.05] p-1">
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

      {loading ? (
        <FullSpinner label="Calculando..." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatCard icon="💰" tone="ember" label="Faturamento bruto" value={brl(revenue?.faturamento_bruto)} />
            <StatCard
              icon="📈"
              tone="green"
              label="Lucro líquido"
              value={brl(revenue?.faturamento_liquido)}
              hint="Venda menos custo dos itens"
            />
            <StatCard icon="🍺" tone="neutral" label="Itens vendidos" value={num(revenue?.total_quantidade_vendida)} />
            <StatCard icon="📦" tone="neutral" label="Produtos" value={productCount} />
          </div>

          {/* Daily sales chart */}
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold text-coal-400">Vendas por dia</p>
            {bars.every((b) => b.value === 0) ? (
              <p className="py-8 text-center text-sm text-coal-400">Sem vendas no período.</p>
            ) : (
              <div className="flex h-40 items-end gap-1.5">
                {bars.map((b, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-ember transition-all"
                        style={{ height: `${Math.max(2, (b.value / maxBar) * 100)}%` }}
                        title={brl(b.value)}
                      />
                    </div>
                    {bars.length <= 10 && (
                      <span className="text-[9px] text-coal-400">{b.label}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock alerts card */}
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-coal-400">Alertas de estoque</p>
              {alertCount > 0 && <span className="badge-red">{alertCount}</span>}
            </div>
            {alertCount === 0 ? (
              <p className="py-4 text-center text-sm text-coal-400">
                ✅ Tudo em ordem, nada faltando.
              </p>
            ) : (
              <div className="space-y-2">
                {[...outItems, ...lowItems].slice(0, 8).map((p) => {
                  const out = p.current_quantity <= 0
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl bg-black/[0.05] px-3.5 py-2.5"
                    >
                      <span className="truncate font-medium">{p.name}</span>
                      <span className={out ? 'badge-red shrink-0' : 'badge-amber shrink-0'}>
                        {out
                          ? '⛔ Esgotado'
                          : `⚠ ${num(p.current_quantity)} ${p.unit?.abbreviation || ''}`}
                      </span>
                    </div>
                  )
                })}
                <Link
                  href="/admin/products"
                  className="mt-1 block text-center text-sm font-semibold text-ember-300 hover:underline"
                >
                  Ver produtos →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto popup: what ran out and what's running low */}
      <Modal
        open={showAlert}
        onClose={() => setShowAlert(false)}
        title="⚠️ Atenção ao estoque"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setShowAlert(false)}>
              Fechar
            </button>
            <Link href="/admin/products" className="btn-primary" onClick={() => setShowAlert(false)}>
              Ver produtos
            </Link>
          </>
        }
      >
        <div className="space-y-5">
          {outItems.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-red-600">
                ⛔ Acabou ({outItems.length})
              </p>
              <div className="space-y-1.5">
                {outItems.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5"
                  >
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="badge-red shrink-0">0 {p.unit?.abbreviation || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowItems.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-700">
                ⚠️ Acabando ({lowItems.length})
              </p>
              <div className="space-y-1.5">
                {lowItems.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5"
                  >
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="badge-amber shrink-0">
                      {num(p.current_quantity)} {p.unit?.abbreviation || ''} · mín{' '}
                      {num(p.low_stock_threshold)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
