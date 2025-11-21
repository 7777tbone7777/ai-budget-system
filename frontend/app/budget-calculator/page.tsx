'use client'

import { useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface CrewMember {
  id: string
  position: string
  rate: number
  rateType: 'hourly' | 'daily' | 'weekly'
  quantity: number
  weeks: number
  union: string
  subtotal: number
}

interface RateLookupResult {
  job_classification: string
  union_local: string
  base_rate: string
  rate_type: string
  location: string
}

export default function BudgetCalculator() {
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<RateLookupResult[]>([])
  const [loading, setLoading] = useState(false)
  const [fringeRate, setFringeRate] = useState(30)
  const [productionWeeks, setProductionWeeks] = useState(12)

  const searchRates = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/rate-cards/smart-lookup`, {
        params: { query: searchTerm }
      })
      setSearchResults(response.data.data || [])
    } catch (error) {
      console.error('Error searching rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const addCrewMember = (result: RateLookupResult) => {
    const newMember: CrewMember = {
      id: crypto.randomUUID(),
      position: result.job_classification,
      rate: parseFloat(result.base_rate),
      rateType: result.rate_type as 'hourly' | 'daily' | 'weekly',
      quantity: 1,
      weeks: productionWeeks,
      union: result.union_local,
      subtotal: 0
    }
    newMember.subtotal = calculateSubtotal(newMember)
    setCrew([...crew, newMember])
    setSearchTerm('')
    setSearchResults([])
  }

  const calculateSubtotal = (member: CrewMember): number => {
    switch (member.rateType) {
      case 'hourly':
        return member.rate * 10 * 5 * member.weeks * member.quantity // 10hr days, 5 days/week
      case 'daily':
        return member.rate * 5 * member.weeks * member.quantity // 5 days/week
      case 'weekly':
        return member.rate * member.weeks * member.quantity
      default:
        return member.rate * member.quantity
    }
  }

  const updateCrewMember = (id: string, field: keyof CrewMember, value: number | string) => {
    setCrew(crew.map(member => {
      if (member.id === id) {
        const updated = { ...member, [field]: value }
        updated.subtotal = calculateSubtotal(updated)
        return updated
      }
      return member
    }))
  }

  const removeCrewMember = (id: string) => {
    setCrew(crew.filter(m => m.id !== id))
  }

  const totalLabor = crew.reduce((sum, m) => sum + m.subtotal, 0)
  const totalFringes = totalLabor * (fringeRate / 100)
  const grandTotal = totalLabor + totalFringes

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Crew Budget Calculator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Build a crew budget using union rates
        </p>
      </div>

      {/* Production Settings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Production Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Production Weeks
            </label>
            <input
              type="number"
              value={productionWeeks}
              onChange={(e) => setProductionWeeks(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fringe Rate (%)
            </label>
            <input
              type="number"
              value={fringeRate}
              onChange={(e) => setFringeRate(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Add Crew Member */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Add Crew Position</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search position (e.g., Gaffer, DP, Key Grip...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchRates()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={searchRates}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 border rounded-md divide-y dark:border-gray-700 dark:divide-gray-700">
            {searchResults.slice(0, 10).map((result, idx) => (
              <div
                key={idx}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                onClick={() => addCrewMember(result)}
              >
                <div>
                  <div className="font-medium">{result.job_classification}</div>
                  <div className="text-sm text-gray-500">{result.union_local} - {result.location}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{formatCurrency(parseFloat(result.base_rate))}</div>
                  <div className="text-sm text-gray-500">/{result.rate_type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crew List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Crew List ({crew.length})</h2>

        {crew.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No crew members added. Search for positions above to add them.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Union</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Weeks</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {crew.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-2 font-medium">{member.position}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{member.union}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={member.rate}
                        onChange={(e) => updateCrewMember(member.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-2 text-sm">{member.rateType}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={member.quantity}
                        onChange={(e) => updateCrewMember(member.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={member.weeks}
                        onChange={(e) => updateCrewMember(member.id, 'weeks', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-green-600">
                      {formatCurrency(member.subtotal)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeCrewMember(member.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals */}
      {crew.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Budget Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>Labor Subtotal:</span>
              <span className="font-semibold">{formatCurrency(totalLabor)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Fringes ({fringeRate}%):</span>
              <span className="font-semibold">{formatCurrency(totalFringes)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-xl font-bold">
              <span>Grand Total:</span>
              <span className="text-green-600">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
