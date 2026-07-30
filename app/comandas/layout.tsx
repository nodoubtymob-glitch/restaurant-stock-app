import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import AppShell from '@/components/layout/AppShell'

export default async function ComandasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getSessionProfile()
  if (!profile) redirect('/login')

  return (
    <AppShell role={profile.role} email={profile.email}>
      {children}
    </AppShell>
  )
}
