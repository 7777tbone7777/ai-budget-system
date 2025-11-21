'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface CrewPosition {
  id: string
  position_name: string
  department: string
  typical_production_types: string[]
  union_jurisdiction: string
}

interface RateCard {
  id: string
  union_local: string
  job_classification: string
  base_rate: string
  rate_type: string
}

interface BudgetLine {
  id: string
  position: string
  union_local: string
  rate: number
  weeks: number
  quantity: number
  subtotal: number
  fringes: number
  total: number
}

export default function BudgetCalculator() {
  const [positions, setPositions] = useState<CrewPosition[]>([])
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([])
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedUnionLocal, setSelectedUnionLocal] = useState('IATSE Local 44')
  const [weeks, setWeeks] = useState(10)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [productionType, setProductionType] = useState('theatrical')
  const [location, setLocation] = useState('Los Angeles - Studio')
  const [state, setState] = useState('CA')

  const unionLocals = [
    'IATSE Local 44',
    'IATSE Local 80',
    'IATSE Local 600',
    'IATSE Local 700',
    'IATSE Local 706',
    'IATSE Local 728',
  ]

  const productionTypes = [
    { value: 'theatrical', label: 'Theatrical' },
    { value: 'network_tv', label: 'Network TV' },
    { value: 'hb_svod', label: 'HB SVOD' },
    { value: 'multi_camera', label: 'Multi-Camera' },
    { value: 'single_camera', label: 'Single-Camera' },
  ]

  const locations = [
    { value: 'Los Angeles - Studio', state: 'CA' },
    { value: 'Los Angeles - Distant', state: 'CA' },
    { value: 'New York', state: 'NY' },
    { value: 'Atlanta', state: 'GA' },
    { value: 'Albuquerque', state: 'NM' },
  ]

  useEffect(() => {
    fetchPositions()
  }, [])

  const fetchPositions = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/crew-positions`)
      setPositions(response.data.data || [])
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoading(false)
    }
  }

  const addBudgetLine = async () => {
    if (!selectedPosition) {
      alert('Please select a position')
      return
    }

    try {
      // Fetch rate for this position
      const rateResponse = await axios.get(
        `${API_URL}/api/rate-cards/position/${encodeURIComponent(selectedPosition)}?union_local=${encodeURIComponent(selectedUnionLocal)}&location=${encodeURIComponent(location)}&production_type=${productionType}`
      )

      if (!rateResponse.data.data) {
        alert('No rate found for this position/union/location combination')
        return
      }

      const rate = parseFloat(rateResponse.data.data.base_rate)
      const subtotal = rate * weeks * quantity

      // Calculate fringes (simplified - using 25% as estimate)
      const fringesResponse = await axios.post(`${API_URL}/api/fringes/calculate`, {
        union_local: selectedUnionLocal,
        state: state,
        gross_wages: subtotal,
      })

      const fringes = fringesResponse.data.total_fringes || subtotal * 0.25
      const total = subtotal + fringes

      const newLine: BudgetLine = {
        id: Date.now().toString(),
        position: selectedPosition,
        union_local: selectedUnionLocal,
        rate,
        weeks,
        quantity,
        subtotal,
        fringes,
        total,
      }

      setBudgetLines([...budgetLines, newLine])

      // Reset form
      setSelectedPosition('')
      setWeeks(10)
      setQuantity(1)
    } catch (error) {
      console.error('Error adding budget line:', error)
      alert('Error adding budget line. Please check the console for details.')
    }
  }

  const removeBudgetLine = (id: string) => {
    setBudgetLines(budgetLines.filter(line => line.id !== id))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const totals = budgetLines.reduce(
    (acc, line) => ({
      subtotal: acc.subtotal + line.subtotal,
      fringes: acc.fringes + line.fringes,
      total: acc.total + line.total,
    }),
    { subtotal: 0, fringes: 0, total: 0 }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Budget Calculator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Build your production budget with union rates and automatic fringe calculations
        </p>
      </div>

      {/* Production Settings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Production Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Production Type
            </label>
            <select
              value={productionType}
              onChange={(e) => setProductionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {productionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => {
                const loc = locations.find(l => l.value === e.target.value)
                setLocation(e.target.value)
                if (loc) setState(loc.state)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {locations.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.value} ({loc.state})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              State
            </label>
            <input
              type="text"
              value={state}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Add Crew Position */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Add Crew Position</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select Position...</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.position_name}>
                  {pos.position_name} ({pos.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Union Local
            </label>
            <select
              value={selectedUnionLocal}
              onChange={(e) => setSelectedUnionLocal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {unionLocals.map((local) => (
                <option key={local} value={local}>
                  {local.replace('IATSE Local ', '')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weeks
            </label>
            <input
              type="number"
              min="1"
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Qty
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={addBudgetLine}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition"
        >
          Add to Budget
        </button>
      </div>

      {/* Budget Lines */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Budget Lines</h2>

        {budgetLines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No budget lines yet. Add crew positions above to start building your budget.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Union
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Weeks
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Subtotal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fringes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {budgetLines.map((line) => (
                  <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {line.position}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {line.union_local.replace('IATSE Local ', 'L')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      {formatCurrency(line.rate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-400">
                      {line.weeks}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-400">
                      {line.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      {formatCurrency(line.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400">
                      {formatCurrency(line.fringes)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(line.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => removeBudgetLine(line.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-900">
                <tr className="font-semibold">
                  <td colSpan={5} className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                    TOTALS:
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                    {formatCurrency(totals.subtotal)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400">
                    {formatCurrency(totals.fringes)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totals.total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Budget Summary */}
      {budgetLines.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Budget Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Gross Wages</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totals.subtotal)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Fringe Benefits</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(totals.fringes)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ({((totals.fringes / totals.subtotal) * 100).toFixed(1)}% of gross)
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Labor Cost</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totals.total)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
