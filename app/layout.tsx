import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'



export const metadata: Metadata = {
  title: 'Ramirez Accounting - Professional Bookkeeping Services',
  description: 'Expert bookkeeping services for small businesses. Monthly bookkeeping, reconciliations, financial statements, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="site-body">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

