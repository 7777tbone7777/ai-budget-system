'use client'

import { useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface ComparisonResult {
  location?: string
  production_type?: string
  rate_type: string
  union_local: string
  avg_rate: string
  min_rate: string
  max_rate: string
  sample_count: number
}

export default function RateComparison() {
  const [searchTerm, setSearchTerm] = useState('')
  const [compareBy, setCompareBy] = useState<'location' | 'production_type'>('location')
  const [results, setResults] = useState<ComparisonResult[]>([])
  const [loading, setLoading] = useState(false)

  const searchComparison = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/rate-cards/compare`, {
        params: {
          job_classification: searchTerm,
          compare_by: compareBy
        }
      })
      setResults(response.data.data || [])
    } catch (error) {
      console.error('Error fetching comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount))
  }

  // Group by location/production_type for better display
  const groupedResults = results.reduce((acc, item) => {
    const key = compareBy === 'location' ? item.location : item.production_type
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, ComparisonResult[]>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Rate Comparison
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Compare rates across locations and production types
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Classification
            </label>
            <input
              type="text"
              placeholder="Enter position (e.g., Camera Operator, Key Grip...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchComparison()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compare By
            </label>
            <select
              value={compareBy}
              onChange={(e) => setCompareBy(e.target.value as 'location' | 'production_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="location">Location</option>
              <option value="production_type">Production Type</option>
            </select>
          </div>
        </div>
        <button
          onClick={searchComparison}
          disabled={loading || !searchTerm.trim()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Compare Rates'}
        </button>
      </div>

      {/* Results */}
      {Object.keys(groupedResults).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Results for "{searchTerm}" by {compareBy === 'location' ? 'Location' : 'Production Type'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedResults).map(([key, items]) => (
              <div key={key} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">{key}</h3>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="border-t pt-2 first:border-t-0 first:pt-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-500">{item.union_local}</div>
                          <div className="text-xs text-gray-400 capitalize">{item.rate_type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(item.avg_rate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(item.min_rate)} - {formatCurrency(item.max_rate)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {item.sample_count} rate{item.sample_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && searchTerm && !loading && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center text-gray-500">
          No rates found for "{searchTerm}". Try a different search term.
        </div>
      )}
    </div>
  )
}
