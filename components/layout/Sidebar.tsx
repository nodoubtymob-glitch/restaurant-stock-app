'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const adminLinks = [
  { href: '/dashboard', label: '📊 Dashboard', icon: '📊' },
  { href: '/admin/products', label: '📦 Produtos', icon: '📦' },
  { href: '/admin/categories', label: '🏷️ Categorias', icon: '🏷️' },
  { href: '/admin/units', label: '📏 Unidades', icon: '📏' },
  { href: '/stock/entrada', label: '📥 Entrada', icon: '📥' },
  { href: '/stock/saida', label: '📤 Saída', icon: '📤' },
  { href: '/historico', label: '📋 Histórico', icon: '📋' },
  { href: '/admin/usuarios', label: '👥 Funcionários', icon: '👥' },
  { href: '/admin/reports', label: '📈 Relatórios', icon: '📈' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-transform md:translate-x-0 z-30 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 rounded-md transition-colors ${
                isActive(link.href)
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 md:hidden z-20"
        />
      )}
    </>
  )
}
