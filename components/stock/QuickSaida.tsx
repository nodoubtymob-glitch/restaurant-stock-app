'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Spinner, { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { num } from '@/lib/format'

interface Prod {
  id: string
  name: string
  current_quantity: number
  low_stock_threshold: number
  photo_url: string | null
  unit?: { name: string; abbreviation: string | null } | null
}

export default function QuickSaida() {
  const supabase = createClient()
  const toast = useToast()

  const [products, setProducts] = useState<Prod[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Prod | null>(null)
  const [qty, setQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('products')
      .select('id,name,current_quantity,low_stock_threshold,photo_url,unit:units(name,abbreviation)')
      .order('name')
    setProducts((data as any as Prod[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [products, search]
  )

  const open = (p: Prod) => {
    setSelected(p)
    setQty(1)
  }
  const close = () => {
    if (submitting) return
    setSelected(null)
  }

  const confirm = async () => {
    if (!selected || qty <= 0) return
    setSubmitting(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const { error } = await supabase.from('stock_movements').insert({
        product_id: selected.id,
        quantity_change: -Math.abs(qty),
        movement_type: 'saída',
        recorded_by: auth.user!.id,
      })
      if (error) throw error
      toast.show(
        `Saída registrada: ${num(qty)} ${
          selected.unit?.abbreviation || ''
        } · ${selected.name}`,
        'success'
      )
      // optimistic local stock update
      setProducts((list) =>
        list.map((p) =>
          p.id === selected.id
            ? { ...p, current_quantity: p.current_quantity - qty }
            : p
        )
      )
      setSelected(null)
    } catch {
      toast.show('Não foi possível registrar. Tente de novo.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <FullSpinner label="Carregando produtos..." />

  if (products.length === 0)
    return (
      <EmptyState
        icon="📦"
        title="Nenhum produto cadastrado"
        description="Peça ao administrador para cadastrar os produtos."
      />
    )

  const unitLabel = selected?.unit?.abbreviation || selected?.unit?.name || ''

  return (
    <div>
      <input
        className="field mb-4"
        placeholder="🔎 Buscar produto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Product tap grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {filtered.map((p) => {
          const low = p.current_quantity <= p.low_stock_threshold
          return (
            <button
              key={p.id}
              onClick={() => open(p)}
              className="card card-hover flex flex-col items-center gap-2 p-3 text-center active:scale-[0.98]"
            >
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-coal-850">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl opacity-30">
                    🍺
                  </div>
                )}
              </div>
              <span className="line-clamp-2 text-sm font-semibold leading-tight">
                {p.name}
              </span>
              <span className={low ? 'badge-red' : 'badge-muted'}>
                {num(p.current_quantity)} {p.unit?.abbreviation || ''}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-coal-100/40">
          Nenhum produto encontrado.
        </p>
      )}

      {/* Quantity bottom sheet */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="relative z-10 w-full max-w-md animate-fade-up">
            <div className="card m-2 rounded-3xl p-5 safe-bottom">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

              <div className="mb-5 text-center">
                <p className="text-lg font-bold">{selected.name}</p>
                <p className="text-sm text-coal-100/45">
                  Em estoque: {num(selected.current_quantity)} {unitLabel}
                </p>
              </div>

              {/* Big stepper */}
              <div className="mb-4 flex items-center justify-center gap-5">
                <button
                  className="grid h-16 w-16 place-items-center rounded-full bg-white/5 text-3xl font-bold active:scale-95 disabled:opacity-40"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  −
                </button>
                <div className="min-w-[4rem] text-center">
                  <div className="text-5xl font-extrabold tabular-nums">{num(qty)}</div>
                  <div className="text-xs uppercase tracking-wide text-coal-100/40">
                    {unitLabel || 'un'}
                  </div>
                </div>
                <button
                  className="grid h-16 w-16 place-items-center rounded-full bg-white/5 text-3xl font-bold active:scale-95"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </button>
              </div>

              {/* Quick chips */}
              <div className="mb-5 flex justify-center gap-2">
                {[1, 2, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQty(n)}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                      qty === n
                        ? 'bg-ember text-white shadow-glow-sm'
                        : 'bg-white/5 text-coal-100/60'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="btn-ghost btn-lg flex-1" onClick={close} disabled={submitting}>
                  Cancelar
                </button>
                <button
                  className="btn-primary btn-lg flex-[2]"
                  onClick={confirm}
                  disabled={submitting}
                >
                  {submitting ? <Spinner /> : '📤'} Confirmar saída
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
