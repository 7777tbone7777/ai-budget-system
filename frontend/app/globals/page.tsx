'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface Global {
  id: string
  production_id: string
  name: string
  value: number
  precision: number
  description: string | null
  global_group: string | null
  created_at: string
  updated_at: string
}

interface Production {
  id?: string
  production_id?: string
  name?: string
  production_name?: string
}

export default function GlobalsPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [selectedProduction, setSelectedProduction] = useState<string>('')
  const [globals, setGlobals] = useState<Global[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGlobal, setEditingGlobal] = useState<Global | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    precision: '2',
    description: '',
    global_group: '',
  })

  // Fetch productions on mount
  useEffect(() => {
    fetchProductions()
  }, [])

  // Fetch globals when production changes
  useEffect(() => {
    if (selectedProduction) {
      fetchGlobals(selectedProduction)
    }
  }, [selectedProduction])

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

  const fetchGlobals = async (productionId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/productions/${productionId}/globals`)
      setGlobals(res.data.data || [])
    } catch (error) {
      console.error('Error fetching globals:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduction) {
      alert('Please select a production')
      return
    }

    try {
      const payload = {
        name: formData.name,
        value: parseFloat(formData.value),
        precision: parseInt(formData.precision),
        description: formData.description || null,
        global_group: formData.global_group || null,
      }

      if (editingGlobal) {
        // Update existing global
        await axios.put(`${API_URL}/api/globals/${editingGlobal.id}`, payload)
      } else {
        // Create new global
        await axios.post(`${API_URL}/api/productions/${selectedProduction}/globals`, payload)
      }

      // Reset form and refresh
      setFormData({ name: '', value: '', precision: '2', description: '', global_group: '' })
      setShowForm(false)
      setEditingGlobal(null)
      fetchGlobals(selectedProduction)
    } catch (error: any) {
      console.error('Error saving global:', error)
      alert(error.response?.data?.error || 'Failed to save global')
    }
  }

  const handleEdit = (global: Global) => {
    setEditingGlobal(global)
    setFormData({
      name: global.name,
      value: global.value.toString(),
      precision: global.precision.toString(),
      description: global.description || '',
      global_group: global.global_group || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this global? This may affect line items that reference it.')) {
      return
    }

    try {
      await axios.delete(`${API_URL}/api/globals/${id}`)
      fetchGlobals(selectedProduction)
    } catch (error: any) {
      console.error('Error deleting global:', error)
      alert(error.response?.data?.error || 'Failed to delete global')
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingGlobal(null)
    setFormData({ name: '', value: '', precision: '2', description: '', global_group: '' })
  }

  // Group globals by global_group
  const groupedGlobals = globals.reduce((acc, global) => {
    const group = global.global_group || 'Ungrouped'
    if (!acc[group]) acc[group] = []
    acc[group].push(global)
    return acc
  }, {} as Record<string, Global[]>)

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Globals Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage reusable variables for budget calculations
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          {showForm ? 'Cancel' : 'Add New Global'}
        </button>
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

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingGlobal ? 'Edit Global' : 'Add New Global'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variable Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., NUM_EPISODES, SHOOT_DAYS"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g., 10, 45, 350.50"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precision (Decimal Places)
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={formData.precision}
                  onChange={(e) => setFormData({ ...formData, precision: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group (Optional)
                </label>
                <input
                  type="text"
                  value={formData.global_group}
                  onChange={(e) => setFormData({ ...formData, global_group: e.target.value })}
                  placeholder="e.g., Production, Rates, Location"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe what this variable is used for..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                {editingGlobal ? 'Update Global' : 'Create Global'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Globals List */}
      {selectedProduction && (
        <div className="space-y-6">
          {Object.keys(groupedGlobals).length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No globals defined yet. Click "Add New Global" to create your first variable.
              </p>
            </div>
          ) : (
            Object.entries(groupedGlobals).map(([group, groupGlobals]) => (
              <div key={group} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  {group}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Variable Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Value
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupGlobals.map((global) => (
                        <tr key={global.id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 px-4">
                            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">
                              {global.name}
                            </code>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold">
                              {global.value.toFixed(global.precision)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {global.description || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleEdit(global)}
                                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(global.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          What are Globals?
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          Globals are reusable variables that can be used throughout your budget. For example, if you have
          10 episodes, you can create a global called <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">NUM_EPISODES=10</code> and
          reference it in line item calculations. When you update the global, all calculations update automatically.
        </p>
      </div>
    </div>
  )
}
