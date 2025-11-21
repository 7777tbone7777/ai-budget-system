'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

export default function NewProduction() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    production_type: 'multi_camera',
    distribution_platform: 'hb_svod',
    shooting_location: 'Los Angeles',
    state: 'CA',
    budget_target: '',
    episode_count: '12',
    episode_length_minutes: '30',
    season_number: '1',
    principal_photography_start: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sideletterInfo, setSideletterInfo] = useState<any>(null)

  const productionTypes = [
    { value: 'multi_camera', label: 'Multi-Camera Sitcom' },
    { value: 'single_camera', label: 'Single-Camera Comedy/Drama' },
    { value: 'theatrical', label: 'Theatrical Feature' },
    { value: 'long_form', label: 'Long-Form/MOW' },
    { value: 'mini_series', label: 'Mini-Series' },
  ]

  const distributionPlatforms = [
    { value: 'theatrical', label: 'Theatrical Release' },
    { value: 'network_tv', label: 'Network TV' },
    { value: 'hb_svod', label: 'High Budget SVOD (Netflix, Apple TV+)' },
    { value: 'hb_avod', label: 'High Budget AVOD (Hulu, Peacock)' },
    { value: 'hb_fast', label: 'High Budget FAST' },
    { value: 'lb_svod', label: 'Low Budget SVOD' },
    { value: 'lb_avod', label: 'Low Budget AVOD' },
  ]

  const locations = [
    { city: 'Los Angeles', state: 'CA' },
    { city: 'New York', state: 'NY' },
    { city: 'Atlanta', state: 'GA' },
    { city: 'Albuquerque', state: 'NM' },
    { city: 'Vancouver', state: 'BC' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const location = locations.find(loc => loc.city === e.target.value)
    if (location) {
      setFormData({
        ...formData,
        shooting_location: location.city,
        state: location.state,
      })
    }
  }

  const determineSideletter = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/sideletters/determine`, {
        production_type: formData.production_type,
        distribution_platform: formData.distribution_platform,
        season_number: parseInt(formData.season_number),
        location: formData.shooting_location,
      })
      setSideletterInfo(response.data.data)
    } catch (error) {
      console.error('Error determining sideletter:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        budget_target: parseFloat(formData.budget_target),
        episode_count: parseInt(formData.episode_count),
        episode_length_minutes: parseInt(formData.episode_length_minutes),
        season_number: parseInt(formData.season_number),
      }

      const response = await axios.post(`${API_URL}/api/productions`, payload)

      if (response.data.success) {
        alert('Production created successfully!')
        router.push('/productions')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create production')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Production
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Set up your production details to generate compliant budgets
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Production Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., My Sitcom Season 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Production Type *
              </label>
              <select
                name="production_type"
                value={formData.production_type}
                onChange={(e) => {
                  handleChange(e)
                  determineSideletter()
                }}
                required
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
                Distribution Platform *
              </label>
              <select
                name="distribution_platform"
                value={formData.distribution_platform}
                onChange={(e) => {
                  handleChange(e)
                  determineSideletter()
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {distributionPlatforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location & Budget */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Location & Budget</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shooting Location *
              </label>
              <select
                value={formData.shooting_location}
                onChange={handleLocationChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {locations.map((loc) => (
                  <option key={loc.city} value={loc.city}>
                    {loc.city}, {loc.state}
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
                name="state"
                value={formData.state}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget Target (USD)
              </label>
              <input
                type="number"
                name="budget_target"
                value={formData.budget_target}
                onChange={handleChange}
                placeholder="e.g., 4000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Principal Photography Start
              </label>
              <input
                type="date"
                name="principal_photography_start"
                value={formData.principal_photography_start}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Series Details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Series Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Episode Count
              </label>
              <input
                type="number"
                name="episode_count"
                value={formData.episode_count}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Episode Length (minutes)
              </label>
              <input
                type="number"
                name="episode_length_minutes"
                value={formData.episode_length_minutes}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Season Number
              </label>
              <input
                type="number"
                name="season_number"
                value={formData.season_number}
                onChange={(e) => {
                  handleChange(e)
                  determineSideletter()
                }}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Sideletter Information */}
        {sideletterInfo && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              Applicable CBA Sideletter
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-blue-800 dark:text-blue-200">
                <span className="font-semibold">Rule:</span> {sideletterInfo.rule_name}
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                {sideletterInfo.rate_adjustment_description}
              </p>
              {sideletterInfo.notes && (
                <p className="text-blue-600 dark:text-blue-400 italic">
                  {sideletterInfo.notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/productions')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition"
          >
            {loading ? 'Creating...' : 'Create Production'}
          </button>
        </div>
      </form>
    </div>
  )
}
