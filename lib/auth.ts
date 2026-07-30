import { createServerClient_ } from '@/lib/supabase/server'
import { AuthUser, UserRole } from '@/lib/types'

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = createServerClient_()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    if (error || !profile) return null

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
    }
  } catch (error) {
    return null
  }
}

export async function checkRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === requiredRole
}

export async function checkIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}
