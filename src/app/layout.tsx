import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Malar Hospital SaaS',
  description: 'Premium Hospital Management System',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#0A4D68',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
