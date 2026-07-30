'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider } from '@/components/ui/Toast'
import { UserRole } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  icon: string
  bottom?: boolean
}

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Painel', icon: '📊', bottom: true },
  { href: '/comandas', label: 'Comandas', icon: '📋', bottom: true },
  { href: '/stock/saida', label: 'Saída', icon: '📤', bottom: true },
  { href: '/admin/products', label: 'Produtos', icon: '📦', bottom: true },
  { href: '/stock/entrada', label: 'Entrada', icon: '📥' },
  { href: '/historico', label: 'Histórico', icon: '🧾' },
  { href: '/admin/categories', label: 'Categorias', icon: '🏷️' },
  { href: '/admin/units', label: 'Unidades', icon: '📏' },
  { href: '/admin/usuarios', label: 'Equipe', icon: '👥' },
]

const STAFF_NAV: NavItem[] = [
  { href: '/comandas', label: 'Comandas', icon: '📋', bottom: true },
  { href: '/stock/saida', label: 'Saída', icon: '📤', bottom: true },
  { href: '/historico', label: 'Histórico', icon: '🧾', bottom: true },
]

function Brand({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative grid ${
          small ? 'h-9 w-9' : 'h-10 w-10'
        } place-items-center rounded-2xl bg-coal-100`}
      >
        <span className="h-3.5 w-3.5 rounded-full bg-ember-500 ring-4 ring-ember-500/25" />
      </div>
      <div className="leading-none">
        <p className="font-display text-[17px] font-bold tracking-tight text-coal-100">
          Brasaroots
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-coal-400">
          Control
        </p>
      </div>
    </div>
  )
}

export default function AppShell({
  role,
  email,
  children,
}: {
  role: UserRole
  email: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const nav = role === 'admin' ? ADMIN_NAV : STAFF_NAV
  const bottomNav = nav.filter((n) => n.bottom).slice(0, 5)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const logout = async () => {
    setSigningOut(true)
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <ToastProvider>
      <div className="min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-black/[0.06] bg-coal-900 md:flex">
          <div className="px-5 py-5">
            <Brand />
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {nav.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition ${
                    active
                      ? 'bg-coal-100 text-white shadow-ink'
                      : 'text-coal-300 hover:bg-black/[0.04] hover:text-coal-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-black/[0.06] p-3">
            <div className="mb-2 px-2">
              <p className="truncate text-xs font-medium text-coal-400">{email}</p>
              <span className={role === 'admin' ? 'badge-ember mt-1' : 'badge-muted mt-1'}>
                {role === 'admin' ? 'Administrador' : 'Funcionário'}
              </span>
            </div>
            <button onClick={logout} disabled={signingOut} className="btn-ghost w-full justify-start">
              🚪 {signingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/[0.06] bg-coal-950/85 px-4 py-3 backdrop-blur md:hidden safe-top">
          <Brand small />
          <button
            onClick={logout}
            disabled={signingOut}
            className="flex h-9 items-center gap-1.5 rounded-full bg-black/[0.05] px-3.5 text-xs font-bold text-coal-300"
          >
            Sair
          </button>
        </header>

        {/* Main content */}
        <main className="md:pl-64">
          <div className="mx-auto max-w-5xl px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-coal-900/95 backdrop-blur md:hidden safe-bottom">
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5">
            {bottomNav.map((item) => {
              const active = isActive(item.href)
              const primary = item.href === '/stock/saida'
              if (primary) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-1 flex-col items-center gap-0.5 px-1 text-[10px] font-bold text-coal-100"
                  >
                    <span className="-mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-ember text-2xl shadow-glow ring-4 ring-coal-900">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-bold transition ${
                    active ? 'text-coal-100' : 'text-coal-400'
                  }`}
                >
                  <span
                    className={`grid h-8 w-full max-w-[3.5rem] place-items-center rounded-xl text-lg transition ${
                      active ? 'bg-coal-100 text-white' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </ToastProvider>
  )
}
