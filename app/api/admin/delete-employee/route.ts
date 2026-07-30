import { NextRequest, NextResponse } from 'next/server'
import { getSessionProfile } from '@/lib/session'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const me = await getSessionProfile()
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const id = body.id
  if (!id) return NextResponse.json({ error: 'ID ausente' }, { status: 400 })
  if (id === me.id) {
    return NextResponse.json(
      { error: 'Você não pode remover a si mesmo' },
      { status: 400 }
    )
  }

  // Deleting the auth user cascades to the profile row (FK ON DELETE CASCADE).
  const { error } = await adminClient.auth.admin.deleteUser(id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
