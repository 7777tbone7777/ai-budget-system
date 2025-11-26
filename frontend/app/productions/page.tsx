'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app';

interface Production {
  id: string;
  name: string;
  production_type: string;
  distribution_platform?: string;
  shooting_location?: string;
  state?: string;
  budget_target?: number;
  episode_count?: number;
  episode_length_minutes?: number;
  season_number?: number;
  principal_photography_start?: string;
  applied_sideletters?: any[];
  created_at: string;
}

export default function ProductionsPage() {
  const router = useRouter();
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProductions();
  }, []);

  const loadProductions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/api/productions`);
      setProductions(response.data.data || []);
    } catch (err: any) {
      console.error('Error loading productions:', err);
      setError('Failed to load productions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduction = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/productions/${id}`);
      await loadProductions();
    } catch (err: any) {
      console.error('Error deleting production:', err);
      alert('Failed to delete production: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduction) return;

    try {
      setSaving(true);
      await axios.put(`${API_URL}/api/productions/${editingProduction.id}`, editingProduction);
      setEditingProduction(null);
      await loadProductions();
    } catch (err: any) {
      console.error('Error updating production:', err);
      alert('Failed to update production: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const formatProductionType = (type: string) => {
    const types: { [key: string]: string } = {
      'multi_camera': 'Multi-Camera Sitcom',
      'single_camera': 'Single-Camera Comedy/Drama',
      'theatrical': 'Theatrical Feature',
      'long_form': 'Long-Form/MOW',
      'mini_series': 'Mini-Series',
    };
    return types[type] || type;
  };

  const formatPlatform = (platform?: string) => {
    if (!platform) return '-';
    const platforms: { [key: string]: string } = {
      'theatrical': 'Theatrical',
      'network_tv': 'Network TV',
      'hb_svod': 'HB SVOD',
      'hb_avod': 'HB AVOD',
      'hb_fast': 'HB FAST',
      'lb_svod': 'LB SVOD',
      'lb_avod': 'LB AVOD',
    };
    return platforms[platform] || platform;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading productions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Productions
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your production budgets
          </p>
        </div>
        <button
          onClick={() => router.push('/productions/new')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          + Create New Production
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Productions List */}
      {productions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🎬</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Productions Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Get started by creating your first production
          </p>
          <button
            onClick={() => router.push('/productions/new')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Create First Production
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productions.map((production) => (
            <div
              key={production.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => router.push(`/productions/${production.id}/budget`)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                  {production.name}
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatProductionType(production.production_type)}
                  </span>
                </div>

                {production.distribution_platform && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatPlatform(production.distribution_platform)}
                    </span>
                  </div>
                )}

                {production.shooting_location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Location:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {production.shooting_location}, {production.state}
                    </span>
                  </div>
                )}

                {production.budget_target && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Budget Target:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      ${Number(production.budget_target).toLocaleString()}
                    </span>
                  </div>
                )}

                {production.episode_count && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Episodes:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {production.episode_count} eps (S{production.season_number || 1})
                    </span>
                  </div>
                )}

                {production.principal_photography_start && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {new Date(production.principal_photography_start).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/productions/${production.id}/budget`);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
                >
                  View Budget →
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProduction(production);
                    }}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduction(production.id, production.name);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {productions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {productions.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Productions
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {productions.filter(p => p.budget_target).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                With Budget Targets
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                ${productions
                  .reduce((sum, p) => sum + (Number(p.budget_target) || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Budget Targets
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Production
                </h2>
                <button
                  onClick={() => setEditingProduction(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateProduction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Production Name
                  </label>
                  <input
                    type="text"
                    value={editingProduction.name}
                    onChange={(e) => setEditingProduction({...editingProduction, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Production Type
                    </label>
                    <select
                      value={editingProduction.production_type}
                      onChange={(e) => setEditingProduction({...editingProduction, production_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="single_camera">Single-Camera Comedy/Drama</option>
                      <option value="multi_camera">Multi-Camera Sitcom</option>
                      <option value="theatrical">Theatrical Feature</option>
                      <option value="long_form">Long-Form/MOW</option>
                      <option value="mini_series">Mini-Series</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distribution Platform
                    </label>
                    <select
                      value={editingProduction.distribution_platform || ''}
                      onChange={(e) => setEditingProduction({...editingProduction, distribution_platform: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Platform</option>
                      <option value="theatrical">Theatrical</option>
                      <option value="network_tv">Network TV</option>
                      <option value="hb_svod">HB SVOD (Streaming)</option>
                      <option value="hb_avod">HB AVOD</option>
                      <option value="hb_fast">HB FAST</option>
                      <option value="lb_svod">LB SVOD</option>
                      <option value="lb_avod">LB AVOD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Shooting Location
                    </label>
                    <input
                      type="text"
                      value={editingProduction.shooting_location || ''}
                      onChange={(e) => setEditingProduction({...editingProduction, shooting_location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Los Angeles"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={editingProduction.state || ''}
                      onChange={(e) => setEditingProduction({...editingProduction, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., CA"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Budget Target ($)
                  </label>
                  <input
                    type="number"
                    value={editingProduction.budget_target || ''}
                    onChange={(e) => setEditingProduction({...editingProduction, budget_target: parseFloat(e.target.value) || undefined})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="80000000"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Episodes
                    </label>
                    <input
                      type="number"
                      value={editingProduction.episode_count || ''}
                      onChange={(e) => setEditingProduction({...editingProduction, episode_count: parseInt(e.target.value) || undefined})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Episode Length (min)
                    </label>
                    <input
                      type="number"
                      value={editingProduction.episode_length_minutes || ''}
                      onChange={(e) => setEditingProduction({...editingProduction, episode_length_minutes: parseInt(e.target.value) || undefined})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Season
                    </label>
                    <input
                      type="number"
                      value={editingProduction.season_number || ''}
                      onChange={(e) => setEditingProduction({...editingProduction, season_number: parseInt(e.target.value) || undefined})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Principal Photography Start Date
                  </label>
                  <input
                    type="date"
                    value={editingProduction.principal_photography_start ? editingProduction.principal_photography_start.split('T')[0] : ''}
                    onChange={(e) => setEditingProduction({...editingProduction, principal_photography_start: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Show Applied Sideletters (read-only) */}
                {editingProduction.applied_sideletters && editingProduction.applied_sideletters.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Applied Sideletters
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
                      {editingProduction.applied_sideletters.map((sl: any, idx: number) => (
                        <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                          {sl.sideletter_name}
                          {sl.wage_adjustment_pct !== '0.00' && (
                            <span className="ml-2 text-xs text-orange-600">
                              ({sl.wage_adjustment_pct}% wage adjustment)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setEditingProduction(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
