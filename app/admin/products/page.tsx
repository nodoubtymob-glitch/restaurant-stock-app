'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Category, Unit } from '@/lib/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import Spinner, { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import PhotoUpload from '@/components/products/PhotoUpload'
import { useToast } from '@/components/ui/Toast'
import { brl, num, dateBR, todayISO } from '@/lib/format'

interface ProductRow {
  id: string
  name: string
  category_id: string
  unit_id: string
  entry_date: string
  expiration_date: string | null
  photo_url: string | null
  low_stock_threshold: number
  current_quantity: number
  category?: { name: string } | null
  unit?: { name: string; abbreviation: string | null } | null
  pricing?: { cost_price: number; sale_price: number }[] | null
}

const emptyForm = {
  name: '',
  category_id: '',
  unit_id: '',
  cost_price: '',
  sale_price: '',
  entry_date: todayISO(),
  expiration_date: '',
  low_stock_threshold: '5',
  photo_url: null as string | null,
}

export default function ProductsPage() {
  const supabase = createClient()
  const toast = useToast()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<ProductRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }, { data: uns }] = await Promise.all([
      supabase
        .from('products')
        .select(
          '*, category:categories(name), unit:units(name,abbreviation), pricing:product_pricing(cost_price,sale_price)'
        )
        .order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('units').select('*').order('name'),
    ])
    setProducts((prods as ProductRow[]) || [])
    setCategories((cats as Category[]) || [])
    setUnits((uns as Unit[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canCreate = categories.length > 0 && units.length > 0

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [products, search]
  )

  const openNew = () => {
    setEditingId(null)
    setForm({ ...emptyForm, entry_date: todayISO() })
    setModal(true)
  }

  const openEdit = (p: ProductRow) => {
    const price = p.pricing?.[0]
    setEditingId(p.id)
    setForm({
      name: p.name,
      category_id: p.category_id,
      unit_id: p.unit_id,
      cost_price: price ? String(price.cost_price) : '',
      sale_price: price ? String(price.sale_price) : '',
      entry_date: p.entry_date,
      expiration_date: p.expiration_date || '',
      low_stock_threshold: String(p.low_stock_threshold),
      photo_url: p.photo_url,
    })
    setModal(true)
  }

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim() || !form.category_id || !form.unit_id) {
      toast.show('Preencha nome, categoria e unidade', 'error')
      return
    }
    const cost = parseFloat(form.cost_price.replace(',', '.')) || 0
    const sale = parseFloat(form.sale_price.replace(',', '.')) || 0
    const threshold = parseFloat(form.low_stock_threshold.replace(',', '.')) || 0

    setSaving(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const productPayload = {
        name: form.name.trim(),
        category_id: form.category_id,
        unit_id: form.unit_id,
        entry_date: form.entry_date || todayISO(),
        expiration_date: form.expiration_date || null,
        photo_url: form.photo_url,
        low_stock_threshold: threshold,
      }

      let productId = editingId
      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({ ...productPayload, created_by: auth.user!.id })
          .select('id')
          .single()
        if (error) throw error
        productId = data.id
      }

      // upsert pricing (admin-only table)
      const { error: perr } = await supabase
        .from('product_pricing')
        .upsert(
          { product_id: productId, cost_price: cost, sale_price: sale },
          { onConflict: 'product_id' }
        )
      if (perr) throw perr

      toast.show(editingId ? 'Produto atualizado' : 'Produto criado', 'success')
      setModal(false)
      load()
    } catch (e: any) {
      toast.show('Erro ao salvar produto', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('products').delete().eq('id', toDelete.id)
      if (error) throw error
      toast.show('Produto removido', 'success')
      setToDelete(null)
      load()
    } catch {
      toast.show('Não foi possível remover (há movimentações vinculadas)', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        subtitle="Cadastro, preços e níveis de estoque"
        action={
          <button className="btn-primary" onClick={openNew} disabled={!canCreate}>
            + Novo
          </button>
        }
      />

      {!canCreate && !loading && (
        <div className="card mb-4 border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700">
          Antes de cadastrar produtos, crie ao menos uma{' '}
          <Link href="/admin/categories" className="font-semibold underline">
            categoria
          </Link>{' '}
          e uma{' '}
          <Link href="/admin/units" className="font-semibold underline">
            unidade
          </Link>
          .
        </div>
      )}

      {products.length > 0 && (
        <input
          className="field mb-4"
          placeholder="🔎 Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {loading ? (
        <FullSpinner label="Carregando produtos..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📦"
          title={products.length ? 'Nada encontrado' : 'Nenhum produto ainda'}
          description={
            products.length
              ? 'Tente outro termo de busca.'
              : 'Cadastre seu primeiro produto para começar a controlar o estoque.'
          }
          action={
            canCreate && !products.length ? (
              <button className="btn-primary" onClick={openNew}>
                + Cadastrar produto
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {filtered.map((p) => {
            const price = p.pricing?.[0]
            const low = p.current_quantity <= p.low_stock_threshold
            const margin =
              price && price.sale_price > 0
                ? ((price.sale_price - price.cost_price) / price.sale_price) * 100
                : null
            return (
              <div key={p.id} className="card card-hover flex gap-3 p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-coal-850">
                  {p.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl opacity-30">
                      📦
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">{p.name}</p>
                    <div className="flex shrink-0 gap-1">
                      <button className="btn-ghost px-2.5 py-1.5 text-xs" onClick={() => openEdit(p)}>
                        ✏️
                      </button>
                      <button
                        className="btn-danger px-2.5 py-1.5 text-xs"
                        onClick={() => setToDelete(p)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-coal-400">
                    {p.category?.name} · {p.unit?.abbreviation || p.unit?.name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={low ? 'badge-red' : 'badge-green'}>
                      {low ? '⚠ ' : ''}
                      {num(p.current_quantity)} em estoque
                    </span>
                    {price && <span className="badge-muted">Venda {brl(price.sale_price)}</span>}
                    {margin !== null && (
                      <span className="badge-ember">margem {margin.toFixed(0)}%</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editingId ? 'Editar produto' : 'Novo produto'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving && <Spinner />} Salvar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <PhotoUpload value={form.photo_url} onChange={(url) => set('photo_url', url)} />

          <div>
            <label className="label">Nome do produto</label>
            <input
              className="field"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex.: Cerveja Brahma 600ml"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoria</label>
              <select
                className="field"
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
              >
                <option value="">Selecione</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Unidade</label>
              <select
                className="field"
                value={form.unit_id}
                onChange={(e) => set('unit_id', e.target.value)}
              >
                <option value="">Selecione</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preço de custo (R$)</label>
              <input
                className="field"
                inputMode="decimal"
                value={form.cost_price}
                onChange={(e) => set('cost_price', e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="label">Preço de venda (R$)</label>
              <input
                className="field"
                inputMode="decimal"
                value={form.sale_price}
                onChange={(e) => set('sale_price', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Entrada</label>
              <input
                type="date"
                className="field"
                value={form.entry_date}
                onChange={(e) => set('entry_date', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Validade (opcional)</label>
              <input
                type="date"
                className="field"
                value={form.expiration_date}
                onChange={(e) => set('expiration_date', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Alerta de estoque baixo (mínimo)</label>
            <input
              className="field"
              inputMode="decimal"
              value={form.low_stock_threshold}
              onChange={(e) => set('low_stock_threshold', e.target.value)}
              placeholder="Ex.: 5"
            />
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!toDelete}
        title="Remover produto"
        message={`Remover "${toDelete?.name}"? Isso não pode ser desfeito.`}
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
