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
  season_number?: number;
  principal_photography_start?: string;
  created_at: string;
}

export default function ProductionsPage() {
  const router = useRouter();
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                      ${production.budget_target.toLocaleString()}
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
                  .reduce((sum, p) => sum + (p.budget_target || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Budget Targets
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
