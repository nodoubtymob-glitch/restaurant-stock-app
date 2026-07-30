import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Restaurant Stock Control',
  description: 'Sistema de controle de estoque para restaurantes e bares',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          {children}
        </div>
      </body>
    </html>
  )
}
