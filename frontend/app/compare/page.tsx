'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface TaxIncentive {
  id: string
  state: string
  program_name: string
  incentive_type: string
  rate_percentage: string
  maximum_credit: string | null
  minimum_spend: string | null
  transferable: boolean
  refundable: boolean
  description: string
}

interface LocationComparison {
  location: string
  state: string
  laborCost: number
  taxCredit: number
  netCost: number
  taxIncentive: TaxIncentive | null
}

export default function LocationComparison() {
  const [baseLaborCost, setBaseLaborCost] = useState(1000000)
  const [taxIncentives, setTaxIncentives] = useState<TaxIncentive[]>([])
  const [comparisons, setComparisons] = useState<LocationComparison[]>([])
  const [loading, setLoading] = useState(true)

  const locations = [
    { name: 'Los Angeles', state: 'CA' },
    { name: 'Atlanta', state: 'GA' },
    { name: 'Albuquerque', state: 'NM' },
    { name: 'New York', state: 'NY' },
  ]

  useEffect(() => {
    fetchTaxIncentives()
  }, [])

  useEffect(() => {
    if (taxIncentives.length > 0) {
      calculateComparisons()
    }
  }, [baseLaborCost, taxIncentives])

  const fetchTaxIncentives = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/tax-incentives`)
      setTaxIncentives(response.data.data || [])
    } catch (error) {
      console.error('Error fetching tax incentives:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateComparisons = () => {
    const comps: LocationComparison[] = locations.map((location) => {
      const incentive = taxIncentives.find((inc) => inc.state === location.state)

      let taxCredit = 0
      if (incentive) {
        const rate = parseFloat(incentive.rate_percentage) / 100
        taxCredit = baseLaborCost * rate

        // Apply maximum credit if exists
        if (incentive.maximum_credit) {
          const maxCredit = parseFloat(incentive.maximum_credit)
          taxCredit = Math.min(taxCredit, maxCredit)
        }
      }

      const netCost = baseLaborCost - taxCredit

      return {
        location: location.name,
        state: location.state,
        laborCost: baseLaborCost,
        taxCredit,
        netCost,
        taxIncentive: incentive || null,
      }
    })

    // Sort by net cost (lowest first)
    comps.sort((a, b) => a.netCost - b.netCost)
    setComparisons(comps)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (amount: string) => {
    return `${parseFloat(amount)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  const bestDeal = comparisons[0]
  const savings = comparisons.map((c) => ({
    location: c.location,
    savings: comparisons[comparisons.length - 1].netCost - c.netCost,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Location Comparison
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Compare production costs across different states with tax incentives
        </p>
      </div>

      {/* Budget Input */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Production Labor Budget</h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estimated Labor Cost (before fringes)
          </label>
          <input
            type="number"
            value={baseLaborCost}
            onChange={(e) => setBaseLaborCost(parseInt(e.target.value) || 0)}
            step="100000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg font-semibold"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enter your total labor budget to see tax credit comparisons
          </p>
        </div>
      </div>

      {/* Best Deal Highlight */}
      {bestDeal && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
                Best Value: {bestDeal.location}, {bestDeal.state}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {bestDeal.taxIncentive?.program_name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(bestDeal.netCost)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Net Cost After Tax Credit
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">State-by-State Comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tax Program
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Labor Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tax Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Net Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Savings vs Worst
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {comparisons.map((comp, index) => {
                const saving = savings.find((s) => s.location === comp.location)
                return (
                  <tr
                    key={comp.location}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      index === 0 ? 'bg-green-50 dark:bg-green-900' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {comp.location}, {comp.state}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {comp.taxIncentive ? (
                        <div>
                          <div className="font-medium">
                            {formatPercentage(comp.taxIncentive.rate_percentage)} {comp.taxIncentive.incentive_type}
                          </div>
                          <div className="text-xs">
                            {comp.taxIncentive.transferable && '📄 Transferable '}
                            {comp.taxIncentive.refundable && '💵 Refundable'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No incentive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      {formatCurrency(comp.laborCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600 dark:text-green-400">
                      {comp.taxCredit > 0 ? formatCurrency(comp.taxCredit) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(comp.netCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                      {saving && saving.savings > 0 ? formatCurrency(saving.savings) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Incentive Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparisons.map((comp) => (
          comp.taxIncentive && (
            <div
              key={comp.state}
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {comp.location}, {comp.state}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {comp.taxIncentive.program_name}
                  </p>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatPercentage(comp.taxIncentive.rate_percentage)}
                </div>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {comp.taxIncentive.description}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {comp.taxIncentive.incentive_type}
                  </span>
                </div>
                {comp.taxIncentive.minimum_spend && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Minimum Spend:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(parseFloat(comp.taxIncentive.minimum_spend))}
                    </span>
                  </div>
                )}
                {comp.taxIncentive.maximum_credit && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Maximum Credit:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(parseFloat(comp.taxIncentive.maximum_credit))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transferable:</span>
                  <span className={`font-medium ${comp.taxIncentive.transferable ? 'text-green-600' : 'text-gray-400'}`}>
                    {comp.taxIncentive.transferable ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Refundable:</span>
                  <span className={`font-medium ${comp.taxIncentive.refundable ? 'text-green-600' : 'text-gray-400'}`}>
                    {comp.taxIncentive.refundable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Insights */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
          Key Insights
        </h2>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>
            • <strong>Best Value:</strong> {bestDeal?.location} offers the lowest net cost at{' '}
            {formatCurrency(bestDeal?.netCost || 0)}
          </li>
          <li>
            • <strong>Highest Tax Credit:</strong>{' '}
            {comparisons.reduce((max, comp) =>
              comp.taxCredit > max.taxCredit ? comp : max
            ).location}{' '}
            with{' '}
            {formatCurrency(
              comparisons.reduce((max, comp) =>
                comp.taxCredit > max.taxCredit ? comp : max
              ).taxCredit
            )}
          </li>
          <li>
            • <strong>Transferable Credits:</strong>{' '}
            {comparisons.filter((c) => c.taxIncentive?.transferable).map((c) => c.state).join(', ')}
            {' '}(can be sold for cash)
          </li>
          <li>
            • <strong>Refundable Credits:</strong>{' '}
            {comparisons.filter((c) => c.taxIncentive?.refundable).map((c) => c.state).join(', ')}
            {' '}(receive cash back)
          </li>
        </ul>
      </div>
    </div>
  )
}
