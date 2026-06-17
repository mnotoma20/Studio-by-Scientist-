import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Studio by Scientist — AI-Powered Church Presentation Software',
  description: 'Studio listens as your pastor preaches. Bible verses appear on screen — automatically. No typing. No delays. Just the Word.',
  keywords: 'church presentation software, AI Bible detection, worship software, projection software, church tech',
  openGraph: {
    title: 'Studio by Scientist',
    description: 'AI-Powered Church Presentation Software',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700;1,900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-white font-inter antialiased">
        {children}
      </body>
    </html>
  )
}
