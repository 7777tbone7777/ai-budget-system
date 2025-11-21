import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Budget System - Production Budgeting Platform',
  description: 'AI-powered production budgeting with CBA compliance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold">AI Budget System</h1>
              </div>
              <div className="flex space-x-4">
                <a href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Dashboard
                </a>
                <a href="/rate-cards" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Rate Cards
                </a>
                <a href="/productions" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Productions
                </a>
                <a href="/globals" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Globals
                </a>
                <a href="/formula-tester" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Formula Tester
                </a>
                <a href="/calculator" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Calculator
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
