'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import Spinner, { FullSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

export default function UsuariosPage() {
  const supabase = createClient()
  const toast = useToast()
  const [people, setPeople] = useState<Profile[]>([])
  const [meId, setMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data }, { data: auth }] = await Promise.all([
      supabase.from('profiles').select('*').order('role').order('email'),
      supabase.auth.getUser(),
    ])
    setPeople((data as Profile[]) || [])
    setMeId(auth.user?.id || null)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const create = async () => {
    if (!email.trim() || password.length < 6) {
      toast.show('E-mail e senha (mín. 6) obrigatórios', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro')
      toast.show('Funcionário criado', 'success')
      setModal(false)
      setEmail('')
      setPassword('')
      load()
    } catch (e: any) {
      toast.show(e.message || 'Erro ao criar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/delete-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: toDelete.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro')
      toast.show('Funcionário removido', 'success')
      setToDelete(null)
      load()
    } catch (e: any) {
      toast.show(e.message || 'Erro ao remover', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Equipe"
        subtitle="Administradores e funcionários com acesso ao sistema"
        action={
          <button className="btn-primary" onClick={() => setModal(true)}>
            + Funcionário
          </button>
        }
      />

      {loading ? (
        <FullSpinner label="Carregando..." />
      ) : people.length === 0 ? (
        <EmptyState icon="👥" title="Nenhum usuário" />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {people.map((p) => (
            <div key={p.id} className="card flex items-center justify-between p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`stat-icon shrink-0 ${
                    p.role === 'admin'
                      ? 'bg-ember-500/15 text-ember-300'
                      : 'bg-white/5 text-coal-100/60'
                  }`}
                >
                  {p.role === 'admin' ? '👑' : '🧑‍🍳'}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.email}</p>
                  <span className={p.role === 'admin' ? 'badge-ember mt-1' : 'badge-muted mt-1'}>
                    {p.role === 'admin' ? 'Administrador' : 'Funcionário'}
                    {p.id === meId ? ' · você' : ''}
                  </span>
                </div>
              </div>
              {p.role !== 'admin' && p.id !== meId && (
                <button
                  className="btn-danger shrink-0 px-3 py-2"
                  onClick={() => setToDelete(p)}
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Novo funcionário"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={create} disabled={saving}>
              {saving && <Spinner />} Criar acesso
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="rounded-xl bg-white/5 px-3.5 py-2.5 text-sm text-coal-100/60">
            O funcionário poderá apenas <b>registrar saídas</b> e ver o histórico.
            Não vê preços nem faturamento.
          </p>
          <div>
            <label className="label">E-mail</label>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="funcionario@brasaroots.com"
            />
          </div>
          <div>
            <label className="label">Senha provisória</label>
            <input
              className="field"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
            />
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!toDelete}
        title="Remover funcionário"
        message={`Remover o acesso de "${toDelete?.email}"?`}
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
