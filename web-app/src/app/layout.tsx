import type { Metadata } from 'next'
import './globals.css'

// Using system fonts temporarily to avoid Google Fonts issues
const systemFonts = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

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
      <body className="w-full" style={{ fontFamily: systemFonts }}>
        <div className="min-h-screen bg-gray-50 w-full">
          {children}
        </div>
      </body>
    </html>
  )
}
