import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Studio by Scientist — Admin',
  description: 'Admin panel for Studio by Scientist church presentation software',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={inter.className}
        style={{ backgroundColor: '#0a0a0f', minHeight: '100vh' }}
      >
        {children}
      </body>
    </html>
  )
}
