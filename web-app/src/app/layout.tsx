import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cash Ti Machann - Digital Financial Services',
  description: 'Plateforme de services financiers numériques pour le marché haïtien',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} w-full`}>
        <div className="min-h-screen bg-gray-50 w-full">
          {children}
        </div>
      </body>
    </html>
  )
}
