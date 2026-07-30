'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { FullSpinner } from '@/components/ui/Spinner'
import { Revenue } from '@/lib/types'
import { brl, num, daysAgoISO, todayISO } from '@/lib/format'

interface LowStock {
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
  const [lowStock, setLowStock] = useState<LowStock[]>([])
  const [bars, setBars] = useState<DayBar[]>([])
  const [productCount, setProductCount] = useState(0)

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

      const allProducts = (prods.data as any as LowStock[]) || []
      setLowStock(
        allProducts
          .filter((p) => p.current_quantity <= p.low_stock_threshold)
          .sort((a, b) => a.current_quantity - b.current_quantity)
      )
      setProductCount(count.count || 0)

      // Build daily bars: sale value per day using pricing map
      const { data: pricing } = await supabase
        .from('product_pricing')
        .select('product_id,sale_price')
      const priceMap = new Map<string, number>()
      ;(pricing || []).forEach((p: any) => priceMap.set(p.product_id, p.sale_price))

      const dayCount = days + 1
      const buckets = new Map<string, number>()
      for (let i = 0; i < dayCount; i++) {
        buckets.set(daysAgoISO(days - i), 0)
      }
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

  return (
    <div>
      <PageHeader title="Painel" subtitle="Visão geral do seu negócio" />

      {/* Period selector */}
      <div className="mb-4 inline-flex rounded-xl bg-white/5 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
              period === p.key ? 'bg-ember text-white shadow-glow-sm' : 'text-coal-100/50'
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
          {/* Revenue cards */}
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatCard
              icon="💰"
              tone="ember"
              label="Faturamento bruto"
              value={brl(revenue?.faturamento_bruto)}
            />
            <StatCard
              icon="📈"
              tone="green"
              label="Lucro líquido"
              value={brl(revenue?.faturamento_liquido)}
              hint="Venda menos custo dos itens"
            />
            <StatCard
              icon="🍺"
              tone="neutral"
              label="Itens vendidos"
              value={num(revenue?.total_quantidade_vendida)}
            />
            <StatCard
              icon="📦"
              tone="neutral"
              label="Produtos"
              value={productCount}
            />
          </div>

          {/* Daily sales chart */}
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold text-coal-100/70">
              Vendas por dia
            </p>
            {bars.every((b) => b.value === 0) ? (
              <p className="py-8 text-center text-sm text-coal-100/40">
                Sem vendas no período.
              </p>
            ) : (
              <div className="flex h-40 items-end gap-1.5">
                {bars.map((b, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-ember transition-all"
                        style={{
                          height: `${Math.max(2, (b.value / maxBar) * 100)}%`,
                        }}
                        title={brl(b.value)}
                      />
                    </div>
                    {bars.length <= 10 && (
                      <span className="text-[9px] text-coal-100/35">{b.label}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low stock */}
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-coal-100/70">
                Estoque baixo
              </p>
              {lowStock.length > 0 && (
                <span className="badge-red">{lowStock.length}</span>
              )}
            </div>
            {lowStock.length === 0 ? (
              <p className="py-4 text-center text-sm text-coal-100/40">
                ✅ Tudo em ordem, nenhum item em falta.
              </p>
            ) : (
              <div className="space-y-2">
                {lowStock.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5"
                  >
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="badge-red shrink-0">
                      {num(p.current_quantity)} {p.unit?.abbreviation || ''} / mín{' '}
                      {num(p.low_stock_threshold)}
                    </span>
                  </div>
                ))}
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
    </div>
  )
}
