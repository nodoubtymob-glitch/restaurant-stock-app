'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/lib/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import Spinner, { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

export default function CategoriesPage() {
  const supabase = createClient()
  const toast = useToast()
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setItems((data as Category[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openNew = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setModal(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setName(c.name)
    setDescription(c.description || '')
    setModal(true)
  }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase
          .from('categories')
          .update({ name: name.trim(), description: description.trim() || null })
          .eq('id', editing.id)
        if (error) throw error
        toast.show('Categoria atualizada', 'success')
      } else {
        const { data: auth } = await supabase.auth.getUser()
        const { error } = await supabase.from('categories').insert({
          name: name.trim(),
          description: description.trim() || null,
          created_by: auth.user!.id,
        })
        if (error) throw error
        toast.show('Categoria criada', 'success')
      }
      setModal(false)
      load()
    } catch (e: any) {
      toast.show(e?.message?.includes('duplicate') ? 'Já existe uma categoria com esse nome' : 'Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('categories').delete().eq('id', toDelete.id)
      if (error) throw error
      toast.show('Categoria removida', 'success')
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
        title="Categorias"
        subtitle="Organize seus produtos (bebidas, carnes, hortifruti...)"
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
          icon="🏷️"
          title="Nenhuma categoria ainda"
          description="Crie categorias para organizar o cardápio e o estoque."
          action={
            <button className="btn-primary" onClick={openNew}>
              + Criar primeira categoria
            </button>
          }
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="card card-hover flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.name}</p>
                {c.description && (
                  <p className="truncate text-sm text-coal-400">{c.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button className="btn-ghost px-3 py-2" onClick={() => openEdit(c)}>
                  ✏️
                </button>
                <button className="btn-danger px-3 py-2" onClick={() => setToDelete(c)}>
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
        title={editing ? 'Editar categoria' : 'Nova categoria'}
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
              placeholder="Ex.: Bebidas"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Descrição (opcional)</label>
            <input
              className="field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Cervejas, destilados, refrigerantes"
            />
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!toDelete}
        title="Remover categoria"
        message={`Remover "${toDelete?.name}"? Isso não pode ser desfeito.`}
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
