'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface HealthStatus {
  status: string
  timestamp: string
  database: string
}

interface Stats {
  rateCards: number
  sideletters: number
  taxIncentives: number
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [stats, setStats] = useState<Stats>({ rateCards: 0, sideletters: 0, taxIncentives: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch health status
        const healthRes = await axios.get(`${API_URL}/health`)
        setHealth(healthRes.data)

        // Fetch stats
        const [rateCardsRes, sidelettersRes, taxIncentivesRes] = await Promise.all([
          axios.get(`${API_URL}/api/rate-cards`),
          axios.get(`${API_URL}/api/sideletters`),
          axios.get(`${API_URL}/api/tax-incentives`),
        ])

        setStats({
          rateCards: rateCardsRes.data.count || 0,
          sideletters: sidelettersRes.data.count || 0,
          taxIncentives: taxIncentivesRes.data.count || 0,
        })
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to AI Budget System
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          Your intelligent production budgeting platform with CBA compliance
        </p>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600 dark:text-gray-400">API Status:</span>
            <span className={`ml-2 font-semibold ${health?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              {health?.status || 'Unknown'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Database:</span>
            <span className={`ml-2 font-semibold ${health?.database === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {health?.database || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
            {stats.rateCards}
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200 mt-2">
            Union Rate Cards
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6">
          <div className="text-3xl font-bold text-green-600 dark:text-green-300">
            {stats.sideletters}
          </div>
          <div className="text-sm text-green-800 dark:text-green-200 mt-2">
            Sideletter Rules
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-6">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-300">
            {stats.taxIncentives}
          </div>
          <div className="text-sm text-purple-800 dark:text-purple-200 mt-2">
            Tax Incentive Programs
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <a
            href="/productions/new"
            className="block p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center font-medium transition"
          >
            Create New Production
          </a>
          <a
            href="/rate-cards"
            className="block p-4 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-center font-medium transition"
          >
            Browse Rate Cards
          </a>
          <a
            href="/calculator"
            className="block p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-center font-medium transition"
          >
            Budget Calculator
          </a>
          <a
            href="/compare"
            className="block p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-center font-medium transition"
          >
            Compare Locations
          </a>
          <a
            href="/guild-directory"
            className="block p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-center font-medium transition"
          >
            Guild Directory
          </a>
        </div>
        <div className="mt-4">
          <a
            href="/guide"
            className="block p-4 bg-gray-900 hover:bg-black text-white rounded-lg text-center font-medium transition"
          >
            View User Guide
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">CBA Compliance</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Built-in union agreement rules from IATSE, DGA, WGA, and SAG-AFTRA ensuring your budgets are compliant.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Multi-Location Support</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Compare budgets across LA, Georgia, New Mexico, New York, and more with automatic tax incentive calculations.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">AI-Powered Scenarios</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Generate and compare multiple budget scenarios instantly to find the best approach for your production.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Real-Time Calculations</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Automatic fringe benefits, tax calculations, and union minimum rate enforcement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
