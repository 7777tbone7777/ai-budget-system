'use client'

import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface RateCard {
  id: string
  union_local: string
  job_classification: string
  rate_type: string
  base_rate: string
  location: string
  production_type: string
  effective_date: string
  contract_year: number
  agreement_id: string | null
  agreement_name: string | null
  agreement_short_name: string | null
  agreement_start: string | null
  agreement_end: string | null
}

interface Agreement {
  id: string
  name: string
  short_name: string
  union_name: string
  effective_start: string
  effective_end: string | null
  rate_card_count: number
}

export default function RateCards() {
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  const [allRates, setAllRates] = useState<RateCard[]>([])
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    union_local: '',
    location: '',
    production_type: '',
    rate_type: '',
    agreement: '',
  })

  // Comprehensive list of all union locals in the database
  const unionLocals = [
    'DGA',
    'DGC',
    'EPC',
    'IATSE',
    'IATSE Local 44',
    'IATSE Local 52',
    'IATSE Local 80',
    'IATSE Local 161',
    'IATSE Local 209',
    'IATSE Local 399',
    'IATSE Local 411',
    'IATSE Local 477',
    'IATSE Local 479',
    'IATSE Local 480',
    'IATSE Local 481',
    'IATSE Local 492',
    'IATSE Local 600',
    'IATSE Local 695',
    'IATSE Local 700',
    'IATSE Local 706',
    'IATSE Local 728',
    'IATSE Local 798',
    'IATSE Local 800',
    'IATSE Local 839',
    'IATSE Local 871',
    'IATSE Local 873',
    'IATSE Local 892',
    'SAG-AFTRA',
    'Teamsters Local 399',
    'WGA',
  ]

  const locations = [
    'Los Angeles',
    'New York',
    'Atlanta',
    'Albuquerque',
    'New Orleans',
    'Florida',
    'Ohio',
    'Kentucky',
    'Pennsylvania',
  ]

  const productionTypes = [
    'theatrical',
    'television',
    'Feature Film',
    'Television',
    'Theatrical',
    'Low Budget',
    'SVOD',
  ]

  const rateTypes = [
    'hourly',
    'daily',
    'weekly',
    'flat',
    'program',
  ]

  useEffect(() => {
    fetchRateCards()
    fetchAgreements()
  }, [])

  useEffect(() => {
    filterRateCards()
  }, [filters, searchTerm, allRates])

  const fetchRateCards = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/rate-cards`)
      const data = response.data.data || []
      setAllRates(data)
      setRateCards(data)
    } catch (error) {
      console.error('Error fetching rate cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAgreements = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/agreements`)
      setAgreements(response.data.data || [])
    } catch (error) {
      console.error('Error fetching agreements:', error)
    }
  }

  const filterRateCards = () => {
    let filtered = [...allRates]

    // Filter by union local
    if (filters.union_local) {
      filtered = filtered.filter(card => card.union_local === filters.union_local)
    }

    // Filter by location (partial match)
    if (filters.location) {
      filtered = filtered.filter(card =>
        card.location?.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Filter by production type
    if (filters.production_type) {
      filtered = filtered.filter(card =>
        card.production_type?.toLowerCase().includes(filters.production_type.toLowerCase())
      )
    }

    // Filter by rate type
    if (filters.rate_type) {
      filtered = filtered.filter(card => card.rate_type === filters.rate_type)
    }

    // Filter by agreement
    if (filters.agreement) {
      filtered = filtered.filter(card => card.agreement_short_name === filters.agreement)
    }

    // Search by job classification
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(card =>
        card.job_classification?.toLowerCase().includes(search) ||
        card.union_local?.toLowerCase().includes(search)
      )
    }

    setRateCards(filtered)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const uniqueUnions = new Set(allRates.map(r => r.union_local)).size
    const uniquePositions = new Set(allRates.map(r => r.job_classification)).size
    const uniqueAgreements = new Set(allRates.map(r => r.agreement_short_name).filter(Boolean)).size
    return {
      totalRates: allRates.length,
      uniqueUnions,
      uniquePositions,
      uniqueAgreements,
      filteredCount: rateCards.length,
    }
  }, [allRates, rateCards])

  // Get unique agreement names for filter
  const agreementOptions = useMemo(() => {
    return [...new Set(allRates.map(r => r.agreement_short_name).filter((a): a is string => a !== null && a !== undefined))]
  }, [allRates])

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Union Rate Cards
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Browse and search 2024-2027 union minimum rates
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalRates}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Total Rates</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.uniqueUnions}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Unions</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.uniquePositions}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Positions</div>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats.uniqueAgreements}
          </div>
          <div className="text-sm text-indigo-700 dark:text-indigo-300">Agreements</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.filteredCount}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Showing</div>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Positions
        </label>
        <input
          type="text"
          placeholder="Search by position (e.g., Key Grip, Camera Operator, Director...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Union / Guild
            </label>
            <select
              value={filters.union_local}
              onChange={(e) => setFilters({ ...filters, union_local: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Unions</option>
              {unionLocals.map((local) => (
                <option key={local} value={local}>
                  {local}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Agreement
            </label>
            <select
              value={filters.agreement}
              onChange={(e) => setFilters({ ...filters, agreement: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Agreements</option>
              {agreementOptions.map((agreement) => (
                <option key={agreement} value={agreement}>
                  {agreement}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rate Type
            </label>
            <select
              value={filters.rate_type}
              onChange={(e) => setFilters({ ...filters, rate_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Rate Types</option>
              {rateTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Production Type
            </label>
            <select
              value={filters.production_type}
              onChange={(e) => setFilters({ ...filters, production_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Types</option>
              {productionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setFilters({ union_local: '', location: '', production_type: '', rate_type: '', agreement: '' })
            setSearchTerm('')
          }}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Clear All Filters
        </button>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Rate Cards ({rateCards.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : rateCards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No rate cards found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Union Local
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agreement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Production Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Effective Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rateCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {card.union_local}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {card.job_classification}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {card.agreement_short_name ? (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded text-xs font-medium">
                          {card.agreement_short_name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {card.production_type ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded text-xs font-medium">
                          {card.production_type.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(card.base_rate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {card.rate_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {card.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(card.effective_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
