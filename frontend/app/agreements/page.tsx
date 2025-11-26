'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface Agreement {
  id: string
  name: string
  short_name: string
  union_name: string
  effective_start: string
  effective_end: string | null
  description: string
  metadata: {
    type?: string
    coverage?: string | string[]
    notes?: string
    budget_tiers?: string[]
    budget_thresholds?: Record<string, number>
    pension_health?: Record<string, number>
    [key: string]: unknown
  }
  rate_card_count: string
}

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUnion, setSelectedUnion] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchAgreements()
  }, [])

  const fetchAgreements = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/agreements`)
      setAgreements(response.data.data || [])
    } catch (error) {
      console.error('Error fetching agreements:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique unions
  const unions = [...new Set(agreements.map(a => a.union_name))].sort()

  // Filter agreements
  const filteredAgreements = selectedUnion === 'all'
    ? agreements
    : agreements.filter(a => a.union_name === selectedUnion)

  // Group by union
  const groupedByUnion = filteredAgreements.reduce((acc, agreement) => {
    if (!acc[agreement.union_name]) {
      acc[agreement.union_name] = []
    }
    acc[agreement.union_name].push(agreement)
    return acc
  }, {} as Record<string, Agreement[]>)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Ongoing'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isActive = (agreement: Agreement) => {
    const now = new Date()
    const start = new Date(agreement.effective_start)
    const end = agreement.effective_end ? new Date(agreement.effective_end) : null
    return start <= now && (!end || end >= now)
  }

  const totalRateCards = agreements.reduce((sum, a) => sum + parseInt(a.rate_card_count || '0'), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Union Agreements
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Active guild and union agreements in the system
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {agreements.length}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Agreements</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {unions.length}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Unions/Guilds</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {totalRateCards.toLocaleString()}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Rate Cards</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {agreements.filter(isActive).length}
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-300">Currently Active</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Union/Guild
        </label>
        <select
          value={selectedUnion}
          onChange={(e) => setSelectedUnion(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">All Unions/Guilds</option>
          {unions.map((union) => (
            <option key={union} value={union}>
              {union}
            </option>
          ))}
        </select>
      </div>

      {/* Agreements List */}
      {loading ? (
        <div className="text-center py-8">Loading agreements...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByUnion).map(([union, unionAgreements]) => (
            <div key={union} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                  {union}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({unionAgreements.length} agreement{unionAgreements.length !== 1 ? 's' : ''})
                  </span>
                </h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {unionAgreements.map((agreement) => (
                  <div key={agreement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {/* Main Row */}
                    <div
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === agreement.id ? null : agreement.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400">
                              {expandedId === agreement.id ? '▼' : '▶'}
                            </span>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {agreement.name}
                            </h3>
                            {isActive(agreement) ? (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                                Expired
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-7">
                            {agreement.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {parseInt(agreement.rate_card_count).toLocaleString()} rates
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(agreement.effective_start)} - {formatDate(agreement.effective_end)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === agreement.id && (
                      <div className="px-6 pb-4 ml-7 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Short Name:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">{agreement.short_name}</span>
                          </div>
                          {agreement.metadata?.type && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Type:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">{agreement.metadata.type.replace(/_/g, ' ')}</span>
                            </div>
                          )}
                          {agreement.metadata?.coverage && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Coverage:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {Array.isArray(agreement.metadata.coverage)
                                  ? agreement.metadata.coverage.join(', ')
                                  : agreement.metadata.coverage}
                              </span>
                            </div>
                          )}
                        </div>

                        {agreement.metadata?.notes && (
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Notes:</span>
                            <span className="ml-2 text-gray-700 dark:text-gray-300">{agreement.metadata.notes}</span>
                          </div>
                        )}

                        {agreement.metadata?.budget_thresholds && (
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400 block mb-1">Budget Thresholds:</span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(agreement.metadata.budget_thresholds).map(([key, value]) => (
                                <span key={key} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  {key.replace(/_/g, ' ')}: ${typeof value === 'number' ? value.toLocaleString() : value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {agreement.metadata?.pension_health && (
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400 block mb-1">P&H Contributions:</span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(agreement.metadata.pension_health).map(([key, value]) => (
                                <span key={key} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                  {key.replace(/_/g, ' ')}: {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <a
                            href={`/rate-cards?agreement=${encodeURIComponent(agreement.short_name)}`}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View {agreement.rate_card_count} rate cards →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
