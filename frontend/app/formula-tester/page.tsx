'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface Production {
  id?: string
  production_id?: string
  name?: string
  production_name?: string
}

interface Global {
  name: string
  value: number
}

interface EvaluationResult {
  formula: string
  value: number
  resolved: string
  globals_used: Global[]
}

export default function FormulaTesterPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [selectedProduction, setSelectedProduction] = useState<string>('')
  const [formula, setFormula] = useState('')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)

  const [examples] = useState([
    'NUM_EPISODES * 5000',
    'SHOOT_DAYS * DAILY_RATE',
    '(NUM_EPISODES + 2) * 1500',
    'SHOOT_DAYS * CREW_SIZE * DAILY_RATE',
    '12000',
  ])

  useEffect(() => {
    fetchProductions()
  }, [])

  const fetchProductions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/productions`)
      setProductions(res.data.data || [])
      if (res.data.data.length > 0) {
        setSelectedProduction(res.data.data[0].production_id || res.data.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching productions:', error)
    } finally {
      setLoading(false)
    }
  }

  const evaluateFormula = async () => {
    if (!formula.trim()) {
      setError('Please enter a formula')
      return
    }

    if (!selectedProduction) {
      setError('Please select a production')
      return
    }

    setEvaluating(true)
    setError('')
    setResult(null)

    try {
      const res = await axios.post(
        `${API_URL}/api/productions/${selectedProduction}/formulas/evaluate`,
        { formula }
      )

      setResult(res.data)
    } catch (err: any) {
      console.error('Error evaluating formula:', err)
      setError(err.response?.data?.error || 'Failed to evaluate formula')
    } finally {
      setEvaluating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      evaluateFormula()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Formula Tester
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Test budget formulas with global variables
        </p>
      </div>

      {/* Production Selector */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Production
        </label>
        <select
          value={selectedProduction}
          onChange={(e) => setSelectedProduction(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {productions.map((prod) => (
            <option
              key={prod.id || prod.production_id}
              value={prod.production_id || prod.id}
            >
              {prod.production_name || prod.name}
            </option>
          ))}
        </select>
      </div>

      {/* Formula Input */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter Formula
        </label>
        <div className="space-y-4">
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., NUM_EPISODES * 5000, SHOOT_DAYS * DAILY_RATE"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-mono"
          />

          <button
            onClick={evaluateFormula}
            disabled={evaluating}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
          >
            {evaluating ? 'Evaluating...' : 'Evaluate Formula'}
          </button>
        </div>

        {/* Example Formulas */}
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Example Formulas:
          </p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setFormula(example)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-mono transition"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
            Evaluation Result
          </h2>

          <div className="space-y-4">
            {/* Original Formula */}
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                Original Formula:
              </p>
              <p className="text-lg font-mono bg-green-100 dark:bg-green-800 px-3 py-2 rounded">
                {result.formula}
              </p>
            </div>

            {/* Globals Used */}
            {result.globals_used && result.globals_used.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  Globals Used:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.globals_used.map((global, idx) => (
                    <div
                      key={idx}
                      className="bg-green-100 dark:bg-green-800 px-3 py-2 rounded flex justify-between items-center"
                    >
                      <code className="font-mono text-sm">{global.name}</code>
                      <span className="font-semibold">{global.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Formula */}
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                Resolved Formula:
              </p>
              <p className="text-lg font-mono bg-green-100 dark:bg-green-800 px-3 py-2 rounded">
                {result.resolved}
              </p>
            </div>

            {/* Final Value */}
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                Result:
              </p>
              <p className="text-4xl font-bold text-green-900 dark:text-green-100">
                ${result.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          How to Use Formulas with Globals
        </h3>
        <div className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
          <p>
            <strong>Global Variables:</strong> Use uppercase names like NUM_EPISODES, SHOOT_DAYS, DAILY_RATE
          </p>
          <p>
            <strong>Operators Supported:</strong> + (addition), - (subtraction), * (multiplication), / (division), () (parentheses)
          </p>
          <p>
            <strong>Example:</strong> If NUM_EPISODES=10 and you enter "NUM_EPISODES * 5000", it evaluates to $50,000
          </p>
          <p>
            <strong>Tip:</strong> Create globals in the Globals page first, then reference them in your formulas
          </p>
        </div>
      </div>
    </div>
  )
}
