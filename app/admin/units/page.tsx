'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Unit } from '@/lib/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import Spinner, { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

export default function UnitsPage() {
  const supabase = createClient()
  const toast = useToast()
  const [items, setItems] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [name, setName] = useState('')
  const [abbr, setAbbr] = useState('')
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Unit | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('units').select('*').order('name')
    setItems((data as Unit[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openNew = () => {
    setEditing(null)
    setName('')
    setAbbr('')
    setModal(true)
  }
  const openEdit = (u: Unit) => {
    setEditing(u)
    setName(u.name)
    setAbbr(u.abbreviation || '')
    setModal(true)
  }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase
          .from('units')
          .update({ name: name.trim(), abbreviation: abbr.trim() || null })
          .eq('id', editing.id)
        if (error) throw error
        toast.show('Unidade atualizada', 'success')
      } else {
        const { data: auth } = await supabase.auth.getUser()
        const { error } = await supabase.from('units').insert({
          name: name.trim(),
          abbreviation: abbr.trim() || null,
          created_by: auth.user!.id,
        })
        if (error) throw error
        toast.show('Unidade criada', 'success')
      }
      setModal(false)
      load()
    } catch (e: any) {
      toast.show(e?.message?.includes('duplicate') ? 'Já existe essa unidade' : 'Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('units').delete().eq('id', toDelete.id)
      if (error) throw error
      toast.show('Unidade removida', 'success')
      setToDelete(null)
      load()
    } catch {
      toast.show('Não foi possível remover (pode ter produtos vinculados)', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Unidades"
        subtitle="Como você mede cada item (kg, litro, garrafa, caixa...)"
        action={
          <button className="btn-primary" onClick={openNew}>
            + Nova
          </button>
        }
      />

      {loading ? (
        <FullSpinner label="Carregando..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon="📏"
          title="Nenhuma unidade ainda"
          description="Cadastre as unidades de medida usadas no seu estoque."
          action={
            <button className="btn-primary" onClick={openNew}>
              + Criar primeira unidade
            </button>
          }
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((u) => (
            <div key={u.id} className="card card-hover flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{u.name}</p>
                {u.abbreviation && (
                  <span className="badge-muted mt-1">{u.abbreviation}</span>
                )}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button className="btn-ghost px-3 py-2" onClick={() => openEdit(u)}>
                  ✏️
                </button>
                <button className="btn-danger px-3 py-2" onClick={() => setToDelete(u)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Editar unidade' : 'Nova unidade'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={save} disabled={saving || !name.trim()}>
              {saving && <Spinner />} Salvar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Garrafa"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Abreviação (opcional)</label>
            <input
              className="field"
              value={abbr}
              onChange={(e) => setAbbr(e.target.value)}
              placeholder="Ex.: gf"
            />
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!toDelete}
        title="Remover unidade"
        message={`Remover "${toDelete?.name}"? Isso não pode ser desfeito.`}
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
