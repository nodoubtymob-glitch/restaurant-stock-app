'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import Spinner, { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { brl, num } from '@/lib/format'

interface Item {
  id: string
  quantity: number
  unit_sale_price: number
  product?: { name: string; unit?: { abbreviation: string | null } | null } | null
}
interface Comanda {
  id: string
  customer_name: string
  status: string
}
interface Prod {
  id: string
  name: string
  current_quantity: number
  unit?: { abbreviation: string | null } | null
}

export default function ComandaDetailPage() {
  const supabase = createClient()
  const toast = useToast()
  const router = useRouter()
  const params = useParams()
  const comandaId = params.id as string

  const [comanda, setComanda] = useState<Comanda | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [products, setProducts] = useState<Prod[]>([])
  const [loading, setLoading] = useState(true)

  const [picker, setPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Prod | null>(null)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  const [closing, setClosing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const load = async () => {
    const [{ data: c }, { data: it }, { data: pr }] = await Promise.all([
      supabase.from('comandas').select('id,customer_name,status').eq('id', comandaId).single(),
      supabase
        .from('comanda_items')
        .select('id,quantity,unit_sale_price,product:products(name,unit:units(abbreviation))')
        .eq('comanda_id', comandaId)
        .order('created_at'),
      supabase
        .from('products')
        .select('id,name,current_quantity,unit:units(abbreviation)')
        .order('name'),
    ])
    setComanda((c as any) || null)
    setItems((it as any as Item[]) || [])
    setProducts((pr as any as Prod[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = useMemo(
    () => items.reduce((s, i) => s + i.quantity * i.unit_sale_price, 0),
    [items]
  )

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase())),
    [products, search]
  )
  const max = selected ? Math.max(0, selected.current_quantity) : 0

  const openPicker = () => {
    setSelected(null)
    setSearch('')
    setQty(1)
    setPicker(true)
  }

  const addItem = async () => {
    if (!selected || qty <= 0) return
    setAdding(true)
    try {
      const { error } = await supabase.rpc('comanda_add_item', {
        p_comanda_id: comandaId,
        p_product_id: selected.id,
        p_quantity: qty,
      })
      if (error) throw error
      toast.show(`+${num(qty)} ${selected.name}`, 'success')
      setSelected(null)
      setQty(1)
      await load()
    } catch (e: any) {
      toast.show(
        String(e?.message || '').includes('insuficiente')
          ? 'Estoque insuficiente'
          : 'Erro ao adicionar item',
        'error'
      )
    } finally {
      setAdding(false)
    }
  }

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase.rpc('comanda_remove_item', { p_item_id: id })
      if (error) throw error
      await load()
    } catch {
      toast.show('Erro ao remover item', 'error')
    }
  }

  const closeComanda = async () => {
    setClosing(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('comandas')
        .update({ status: 'fechada', closed_at: new Date().toISOString(), closed_by: auth.user!.id })
        .eq('id', comandaId)
      if (error) throw error
      toast.show(`Comanda fechada · ${brl(total)}`, 'success')
      router.push('/comandas')
    } catch {
      toast.show('Erro ao fechar comanda', 'error')
      setClosing(false)
      setConfirmClose(false)
    }
  }

  const cancelComanda = async () => {
    setCancelling(true)
    try {
      const { error } = await supabase.rpc('comanda_cancel', { p_comanda_id: comandaId })
      if (error) throw error
      toast.show('Comanda cancelada (estoque devolvido)', 'success')
      router.push('/comandas')
    } catch {
      toast.show('Erro ao cancelar', 'error')
      setCancelling(false)
      setConfirmCancel(false)
    }
  }

  if (loading) return <FullSpinner label="Carregando comanda..." />
  if (!comanda)
    return (
      <EmptyState
        icon="🔍"
        title="Comanda não encontrada"
        action={
          <button className="btn-ghost" onClick={() => router.push('/comandas')}>
            ← Voltar
          </button>
        }
      />
    )

  const open = comanda.status === 'aberta'

  return (
    <div className="pb-32">
      <button
        onClick={() => router.push('/comandas')}
        className="mb-3 text-sm font-bold text-coal-400 hover:text-coal-100"
      >
        ← Comandas
      </button>

      <PageHeader
        title={comanda.customer_name}
        subtitle={open ? 'Comanda aberta' : 'Comanda fechada'}
        action={
          open ? (
            <button className="btn-primary" onClick={openPicker}>
              + Item
            </button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="🍺"
          title="Comanda vazia"
          description="Adicione o que o cliente consumir."
          action={
            open ? (
              <button className="btn-primary" onClick={openPicker}>
                + Adicionar item
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="card flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{i.product?.name || 'Produto'}</p>
                <p className="text-xs text-coal-400">
                  {num(i.quantity)} {i.product?.unit?.abbreviation || ''} × {brl(i.unit_sale_price)}
                </p>
              </div>
              <p className="shrink-0 font-display text-lg font-bold">
                {brl(i.quantity * i.unit_sale_price)}
              </p>
              {open && (
                <button
                  className="btn-danger shrink-0 px-3 py-2"
                  onClick={() => removeItem(i.id)}
                  aria-label="Remover"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sticky total + actions */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-black/[0.06] bg-coal-950/90 px-4 py-3 backdrop-blur md:bottom-0 md:pl-64 safe-bottom">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-coal-400">Total</p>
            <p className="font-display text-2xl font-bold">{brl(total)}</p>
          </div>
          {open && (
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setConfirmCancel(true)}>
                Cancelar
              </button>
              <button className="btn-primary btn-lg" onClick={() => setConfirmClose(true)}>
                Fechar comanda
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add item picker */}
      <Modal open={picker} onClose={() => setPicker(false)} title="Adicionar item">
        <input
          className="field mb-3"
          placeholder="🔎 Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {filtered.map((p) => {
            const out = p.current_quantity <= 0
            return (
              <button
                key={p.id}
                disabled={out}
                onClick={() => {
                  setSelected(p)
                  setQty(1)
                }}
                className={`card flex flex-col items-center gap-1 p-3 text-center transition ${
                  selected?.id === p.id ? 'ring-2 ring-ember-500' : ''
                } ${out ? 'opacity-40' : 'card-hover active:scale-[0.98]'}`}
              >
                <span className="line-clamp-2 text-sm font-bold leading-tight">{p.name}</span>
                <span className={out ? 'badge-red' : 'badge-muted'}>
                  {out ? 'Esgotado' : `${num(p.current_quantity)} ${p.unit?.abbreviation || ''}`}
                </span>
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="mt-4 rounded-2xl bg-black/[0.04] p-4">
            <p className="mb-1 text-center font-bold">{selected.name}</p>
            <p className="mb-3 text-center text-xs text-ember-700">máx: {num(max)}</p>
            <div className="flex items-center justify-center gap-4">
              <button
                className="grid h-14 w-14 place-items-center rounded-full bg-black/[0.05] text-3xl font-bold active:scale-95 disabled:opacity-40"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                −
              </button>
              <div className="min-w-[3rem] text-center font-display text-4xl font-bold tabular-nums">
                {num(qty)}
              </div>
              <button
                className="grid h-14 w-14 place-items-center rounded-full bg-black/[0.05] text-3xl font-bold active:scale-95 disabled:opacity-40"
                onClick={() => setQty((q) => Math.min(max, q + 1))}
                disabled={qty >= max}
              >
                +
              </button>
            </div>
            <button
              className="btn-primary btn-lg mt-4 w-full"
              onClick={addItem}
              disabled={adding || qty > max || max <= 0}
            >
              {adding ? <Spinner /> : null} Adicionar {num(qty)} à comanda
            </button>
          </div>
        )}
      </Modal>

      <Confirm
        open={confirmClose}
        title="Fechar comanda"
        message={`Fechar a comanda de ${comanda.customer_name}? Total: ${brl(total)}.`}
        confirmLabel="Fechar e cobrar"
        loading={closing}
        onConfirm={closeComanda}
        onCancel={() => setConfirmClose(false)}
      />
      <Confirm
        open={confirmCancel}
        title="Cancelar comanda"
        message="Isso devolve todos os itens ao estoque e apaga a comanda. Continuar?"
        confirmLabel="Cancelar comanda"
        loading={cancelling}
        onConfirm={cancelComanda}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  )
}
