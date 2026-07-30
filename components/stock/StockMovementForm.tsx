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
  unit?: { name: string; abbreviation: string | null } | null
  category?: { name: string } | null
}

// movementType MUST match the DB check/RLS exactly ('saída' carries the accent).
export default function StockMovementForm({
  movementType,
}: {
  movementType: 'entrada' | 'saída'
}) {
  const supabase = createClient()
  const toast = useToast()
  const isOut = movementType === 'saída'

  const [products, setProducts] = useState<Prod[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Prod | null>(null)
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id,name,current_quantity,low_stock_threshold,unit:units(name,abbreviation),category:categories(name)')
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

  const submit = async () => {
    if (!selected) return
    const q = parseFloat(qty.replace(',', '.'))
    if (!q || q <= 0) {
      toast.show('Informe uma quantidade válida', 'error')
      return
    }
    setSubmitting(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const change = isOut ? -Math.abs(q) : Math.abs(q)
      const { error } = await supabase.from('stock_movements').insert({
        product_id: selected.id,
        quantity_change: change,
        movement_type: movementType,
        notes: notes.trim() || null,
        recorded_by: auth.user!.id,
      })
      if (error) throw error
      toast.show(
        `${isOut ? 'Saída' : 'Entrada'} registrada: ${num(q)} ${
          selected.unit?.abbreviation || selected.unit?.name || ''
        } de ${selected.name}`,
        'success'
      )
      setSelected(null)
      setQty('')
      setNotes('')
      load()
    } catch {
      toast.show('Não foi possível registrar. Tente novamente.', 'error')
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
        description="Peça ao administrador para cadastrar produtos antes de movimentar o estoque."
      />
    )

  return (
    <div className="space-y-4">
      <input
        className="field"
        placeholder="🔎 Buscar produto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid max-h-[52vh] gap-2 overflow-y-auto pr-1">
        {filtered.map((p) => {
          const active = selected?.id === p.id
          const low = p.current_quantity <= p.low_stock_threshold
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`card flex items-center justify-between p-3.5 text-left transition ${
                active
                  ? 'ring-2 ring-ember-500/60'
                  : 'card-hover'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-coal-100/45">
                  {p.category?.name} · {p.unit?.abbreviation || p.unit?.name}
                </p>
              </div>
              <span className={low ? 'badge-red' : 'badge-green'}>
                {num(p.current_quantity)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Sticky action panel when a product is selected */}
      {selected && (
        <div className="card sticky bottom-24 z-10 space-y-3 border-ember-500/25 p-4 md:bottom-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate font-bold">{selected.name}</p>
              <p className="text-xs text-coal-100/45">
                Em estoque: {num(selected.current_quantity)}{' '}
                {selected.unit?.abbreviation || selected.unit?.name}
              </p>
            </div>
            <button
              className="text-sm text-coal-100/40 hover:text-coal-100"
              onClick={() => setSelected(null)}
            >
              trocar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn-ghost h-12 w-12 shrink-0 text-xl"
              onClick={() =>
                setQty((v) => String(Math.max(0, (parseFloat(v || '0') || 0) - 1)))
              }
            >
              −
            </button>
            <input
              className="field h-12 text-center text-lg font-bold"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
            />
            <button
              className="btn-ghost h-12 w-12 shrink-0 text-xl"
              onClick={() =>
                setQty((v) => String((parseFloat(v || '0') || 0) + 1))
              }
            >
              +
            </button>
          </div>

          <input
            className="field"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observação (opcional)"
          />

          <button
            className={`btn-lg w-full ${isOut ? 'btn-primary' : 'btn-primary'}`}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? <Spinner /> : isOut ? '📤' : '📥'}{' '}
            {isOut ? 'Registrar saída' : 'Registrar entrada'}
          </button>
        </div>
      )}
    </div>
  )
}
