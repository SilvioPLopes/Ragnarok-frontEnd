import type { Metadata, Viewport } from 'next'
import { Press_Start_2P, VT323 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel'
})

const vt323 = VT323({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel-body'
})

export const metadata: Metadata = {
  title: 'Ragnarok Emulator',
  description: 'A pixel art Ragnarok Online emulator frontend',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1625',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${pressStart2P.variable} ${vt323.variable} font-sans antialiased min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '2px solid var(--border)',
              color: 'var(--foreground)',
            }
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
