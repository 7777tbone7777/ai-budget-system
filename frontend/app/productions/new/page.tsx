'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface Agreement {
  id: string
  union_name: string
  agreement_type: string
  effective_date_start: string
  effective_date_end: string
  rules?: any
}

interface Sideletter {
  id: string
  sideletter_name: string
  production_type: string
  distribution_platform: string
  wage_adjustment_pct: number
  holiday_pay_pct: number
  vacation_pay_pct: number
}

interface Recommendations {
  iatse?: Agreement
  sag_aftra?: Agreement
  dga?: Agreement
  wga?: Agreement
  teamsters?: Agreement
  applicable_sideletters: Sideletter[]
}

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
    is_union_signatory: true,
    iatse_agreement_id: '',
    sag_aftra_agreement_id: '',
    dga_agreement_id: '',
    wga_agreement_id: '',
    teamsters_agreement_id: '',
    agreement_notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sideletterInfo, setSideletterInfo] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null)
  const [agreements, setAgreements] = useState<{ [key: string]: Agreement[] }>({})
  const [loadingAgreements, setLoadingAgreements] = useState(true)

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

  // Load available agreements on mount
  useEffect(() => {
    const loadAgreements = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/agreements?active_only=true`)
        setAgreements(response.data.grouped || {})
      } catch (err) {
        console.error('Error loading agreements:', err)
      } finally {
        setLoadingAgreements(false)
      }
    }
    loadAgreements()
  }, [])

  // Get recommended agreements when production parameters change
  useEffect(() => {
    const getRecommendations = async () => {
      try {
        const response = await axios.post(`${API_URL}/api/agreements/recommend`, {
          production_type: formData.production_type,
          distribution_platform: formData.distribution_platform,
          start_date: formData.principal_photography_start || new Date().toISOString().split('T')[0],
          shooting_location: formData.shooting_location,
        })
        setRecommendations(response.data.data)

        // Auto-select recommended agreements if none selected
        const rec = response.data.data
        setFormData(prev => ({
          ...prev,
          iatse_agreement_id: prev.iatse_agreement_id || rec.iatse?.id || '',
          sag_aftra_agreement_id: prev.sag_aftra_agreement_id || rec.sag_aftra?.id || '',
          dga_agreement_id: prev.dga_agreement_id || rec.dga?.id || '',
          wga_agreement_id: prev.wga_agreement_id || rec.wga?.id || '',
          teamsters_agreement_id: prev.teamsters_agreement_id || rec.teamsters?.id || '',
        }))
      } catch (err) {
        console.error('Error getting recommendations:', err)
      }
    }

    if (formData.is_union_signatory) {
      getRecommendations()
    }
  }, [formData.production_type, formData.distribution_platform, formData.principal_photography_start, formData.is_union_signatory])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
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
        budget_target: parseFloat(formData.budget_target) || null,
        // Only include TV-specific fields for non-theatrical productions
        episode_count: formData.production_type !== 'theatrical' ? parseInt(formData.episode_count) : null,
        episode_length_minutes: formData.production_type !== 'theatrical' ? parseInt(formData.episode_length_minutes) : null,
        season_number: formData.production_type !== 'theatrical' ? parseInt(formData.season_number) : null,
        applied_sideletters: recommendations?.applicable_sideletters?.slice(0, 3) || [],
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Production
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Set up your production details and select applicable union agreements
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

            {/* Only show Season Number for TV productions */}
            {formData.production_type !== 'theatrical' && (
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
            )}
          </div>
        </div>

        {/* Series Details - only show for TV productions */}
        {formData.production_type !== 'theatrical' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Series Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>
        )}

        {/* Union Agreements */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Union Agreements</h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_union_signatory"
                checked={formData.is_union_signatory}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Union Signatory Production</span>
            </label>
          </div>

          {formData.is_union_signatory && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select the union agreements this production will operate under. Recommended agreements are auto-selected based on your production parameters.
              </p>

              {loadingAgreements ? (
                <p className="text-gray-500">Loading agreements...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* IATSE Agreement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      IATSE Agreement (BTL Crew)
                    </label>
                    <select
                      name="iatse_agreement_id"
                      value={formData.iatse_agreement_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    >
                      <option value="">Select IATSE Agreement...</option>
                      {(agreements['IATSE'] || []).map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.agreement_type} ({formatDate(ag.effective_date_start)} - {formatDate(ag.effective_date_end)})
                        </option>
                      ))}
                    </select>
                    {recommendations?.iatse && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Recommended: {recommendations.iatse.agreement_type}
                      </p>
                    )}
                  </div>

                  {/* SAG-AFTRA Agreement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SAG-AFTRA Agreement (Talent)
                    </label>
                    <select
                      name="sag_aftra_agreement_id"
                      value={formData.sag_aftra_agreement_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    >
                      <option value="">Select SAG-AFTRA Agreement...</option>
                      {(agreements['SAG-AFTRA'] || []).map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.agreement_type} ({formatDate(ag.effective_date_start)} - {formatDate(ag.effective_date_end)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DGA Agreement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      DGA Agreement (Directors/UPMs)
                    </label>
                    <select
                      name="dga_agreement_id"
                      value={formData.dga_agreement_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    >
                      <option value="">Select DGA Agreement...</option>
                      {(agreements['DGA'] || []).map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.agreement_type} ({formatDate(ag.effective_date_start)} - {formatDate(ag.effective_date_end)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* WGA Agreement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      WGA Agreement (Writers)
                    </label>
                    <select
                      name="wga_agreement_id"
                      value={formData.wga_agreement_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    >
                      <option value="">Select WGA Agreement...</option>
                      {(agreements['WGA'] || []).map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.agreement_type} ({formatDate(ag.effective_date_start)} - {formatDate(ag.effective_date_end)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Teamsters Agreement */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teamsters Agreement (Transportation)
                    </label>
                    <select
                      name="teamsters_agreement_id"
                      value={formData.teamsters_agreement_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    >
                      <option value="">Select Teamsters Agreement...</option>
                      {(agreements['Teamsters Local 399'] || []).map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.agreement_type} ({formatDate(ag.effective_date_start)} - {formatDate(ag.effective_date_end)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Agreement Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Agreement Notes (optional)
                    </label>
                    <textarea
                      name="agreement_notes"
                      value={formData.agreement_notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Any special notes about agreement terms, variances, or waivers..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!formData.is_union_signatory && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              This production will be created as non-union. Union rate cards and sideletter rules will not apply.
            </p>
          )}
        </div>

        {/* Applicable Sideletters */}
        {recommendations?.applicable_sideletters && recommendations.applicable_sideletters.length > 0 && formData.is_union_signatory && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              Applicable Sideletters
            </h2>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Based on your production type and distribution platform, the following sideletters will apply:
            </p>
            <div className="space-y-2">
              {recommendations.applicable_sideletters.slice(0, 3).map((sl, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded p-2">
                  <span className="font-medium text-blue-900 dark:text-blue-100">{sl.sideletter_name}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    sl.wage_adjustment_pct < 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {sl.wage_adjustment_pct < 0 ? `${sl.wage_adjustment_pct}%` : 'Full Rate'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legacy Sideletter Information */}
        {sideletterInfo && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-green-900 dark:text-green-100">
              CBA Sideletter Details
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-green-800 dark:text-green-200">
                <span className="font-semibold">Rule:</span> {sideletterInfo.rule_name}
              </p>
              <p className="text-green-700 dark:text-green-300">
                {sideletterInfo.rate_adjustment_description}
              </p>
              {sideletterInfo.notes && (
                <p className="text-green-600 dark:text-green-400 italic">
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
