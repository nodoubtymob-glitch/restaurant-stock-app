'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import Spinner, { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { brl, dateTimeBR } from '@/lib/format'

interface ComandaRow {
  id: string
  customer_name: string
  status: string
  opened_at: string
  comanda_items: { quantity: number; unit_sale_price: number }[]
}

export default function ComandasPage() {
  const supabase = createClient()
  const toast = useToast()
  const router = useRouter()
  const [comandas, setComandas] = useState<ComandaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('comandas')
      .select('id,customer_name,status,opened_at,comanda_items(quantity,unit_sale_price)')
      .eq('status', 'aberta')
      .order('opened_at', { ascending: false })
    setComandas((data as any as ComandaRow[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const create = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('comandas')
        .insert({ customer_name: name.trim(), opened_by: auth.user!.id })
        .select('id')
        .single()
      if (error) throw error
      setModal(false)
      setName('')
      router.push(`/comandas/${data.id}`)
    } catch {
      toast.show('Erro ao criar comanda', 'error')
    } finally {
      setCreating(false)
    }
  }

  const total = (c: ComandaRow) =>
    (c.comanda_items || []).reduce((s, i) => s + i.quantity * i.unit_sale_price, 0)
  const count = (c: ComandaRow) =>
    (c.comanda_items || []).reduce((s, i) => s + i.quantity, 0)

  return (
    <div>
      <PageHeader
        title="Comandas"
        subtitle="Abra uma comanda pelo nome do cliente"
        action={
          <button className="btn-primary" onClick={() => setModal(true)}>
            + Nova
          </button>
        }
      />

      {loading ? (
        <FullSpinner label="Carregando comandas..." />
      ) : comandas.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Nenhuma comanda aberta"
          description="Crie uma comanda para começar a lançar o consumo do cliente."
          action={
            <button className="btn-primary" onClick={() => setModal(true)}>
              + Abrir comanda
            </button>
          }
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {comandas.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/comandas/${c.id}`)}
              className="card card-hover flex items-center justify-between p-4 text-left active:scale-[0.99]"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold">{c.customer_name}</p>
                <p className="text-xs text-coal-400">
                  {count(c)} {count(c) === 1 ? 'item' : 'itens'} · aberta {dateTimeBR(c.opened_at)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-xl font-bold">{brl(total(c))}</p>
                <span className="badge-ember">aberta</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Nova comanda"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={create} disabled={creating || !name.trim()}>
              {creating && <Spinner />} Abrir
            </button>
          </>
        }
      >
        <div>
          <label className="label">Nome do cliente / mesa</label>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Mesa 5 · João"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
        </div>
      </Modal>
    </div>
  )
}
