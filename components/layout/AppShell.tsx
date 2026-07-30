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
  bottom?: boolean // shows in mobile bottom bar
}

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Painel', icon: '📊', bottom: true },
  { href: '/admin/products', label: 'Produtos', icon: '📦', bottom: true },
  { href: '/stock/saida', label: 'Saída', icon: '📤', bottom: true },
  { href: '/stock/entrada', label: 'Entrada', icon: '📥' },
  { href: '/historico', label: 'Histórico', icon: '🧾', bottom: true },
  { href: '/admin/categories', label: 'Categorias', icon: '🏷️' },
  { href: '/admin/units', label: 'Unidades', icon: '📏' },
  { href: '/admin/usuarios', label: 'Equipe', icon: '👥' },
]

const STAFF_NAV: NavItem[] = [
  { href: '/stock/saida', label: 'Registrar Saída', icon: '📤', bottom: true },
  { href: '/historico', label: 'Histórico', icon: '🧾', bottom: true },
]

function Brand({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`grid ${
          small ? 'h-8 w-8' : 'h-9 w-9'
        } place-items-center rounded-xl bg-ember shadow-glow-sm`}
      >
        <span className="text-lg">🔥</span>
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-extrabold tracking-tight">Brasaroots</p>
        <p className="-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ember-400/80">
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
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/5 bg-coal-900/60 backdrop-blur md:flex">
          <div className="px-5 py-5">
            <Brand />
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive(item.href)
                    ? 'bg-ember-soft text-ember-200 ring-1 ring-inset ring-ember-500/20'
                    : 'text-coal-100/60 hover:bg-white/5 hover:text-coal-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/5 p-3">
            <div className="mb-2 px-2">
              <p className="truncate text-xs text-coal-100/40">{email}</p>
              <span
                className={role === 'admin' ? 'badge-ember mt-1' : 'badge-muted mt-1'}
              >
                {role === 'admin' ? 'Administrador' : 'Funcionário'}
              </span>
            </div>
            <button
              onClick={logout}
              disabled={signingOut}
              className="btn-ghost w-full justify-start"
            >
              🚪 {signingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-coal-950/80 px-4 py-3 backdrop-blur md:hidden safe-top">
          <Brand small />
          <button
            onClick={logout}
            disabled={signingOut}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-white/5 px-3 text-xs font-semibold text-coal-100/70"
          >
            🚪 Sair
          </button>
        </header>

        {/* Main content */}
        <main className="md:pl-64">
          <div className="mx-auto max-w-5xl px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-coal-950/90 backdrop-blur md:hidden safe-bottom">
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5">
            {bottomNav.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition ${
                    active ? 'text-ember-300' : 'text-coal-100/45'
                  }`}
                >
                  <span
                    className={`grid h-8 w-full max-w-[3.5rem] place-items-center rounded-xl text-lg transition ${
                      active ? 'bg-ember-soft ring-1 ring-inset ring-ember-500/20' : ''
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
