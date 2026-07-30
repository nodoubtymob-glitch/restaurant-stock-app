import type { Metadata, Viewport } from 'next'
import { Fredoka } from 'next/font/google'
import '@/app/globals.css'
import RegisterSW from '@/components/pwa/RegisterSW'

const display = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Brasaroots Control',
  description: 'Controle de estoque e faturamento para bar e restaurante',
  manifest: '/manifest.json',
  applicationName: 'Brasaroots Control',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Brasaroots',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#f4f4f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={display.variable}>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  )
}
