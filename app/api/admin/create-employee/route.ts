import { NextRequest, NextResponse } from 'next/server'
import { getSessionProfile } from '@/lib/session'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const me = await getSessionProfile()
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const email = (body.email || '').trim().toLowerCase()
  const password = body.password || ''
  if (!email || password.length < 6) {
    return NextResponse.json(
      { error: 'Informe e-mail e senha (mín. 6 caracteres)' },
      { status: 400 }
    )
  }

  // Create the auth user with the service role. The DB trigger creates the
  // matching profile row with the default role 'funcionario'.
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'funcionario' },
  })

  if (error) {
    const msg = error.message?.includes('already')
      ? 'Já existe um usuário com esse e-mail'
      : error.message || 'Erro ao criar funcionário'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Ensure the profile role is 'funcionario' (trigger may not read app_metadata
  // at insert time on some Supabase versions).
  if (data.user) {
    await adminClient
      .from('profiles')
      .update({ role: 'funcionario', email })
      .eq('id', data.user.id)
  }

  return NextResponse.json({ ok: true, id: data.user?.id })
}
