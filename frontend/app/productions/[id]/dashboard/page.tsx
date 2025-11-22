'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Production {
  id: string;
  name: string;
  production_type: string;
  shooting_location: string;
  budget_target?: number;
  start_date?: string;
  end_date?: string;
}

interface BudgetSummary {
  total: number;
  originalTotal?: number;
  atl: number;
  btl: number;
  post: number;
  fringes: number;
  overhead: number;
  contingency: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface RecentChange {
  id: string;
  description: string;
  amount: number;
  change: number;
  date: string;
  user?: string;
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [production, setProduction] = useState<Production | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [prodRes, summaryRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/summary`)
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProduction(prodData.data);
        }
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData.data?.summary || {
            total: 0, atl: 0, btl: 0, post: 0, fringes: 0, overhead: 0, contingency: 0
          });
          setCategories(summaryData.data?.categories || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [productionId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getVariance = () => {
    if (!summary || !summary.originalTotal) return null;
    const variance = summary.total - summary.originalTotal;
    const variancePercent = (variance / summary.originalTotal) * 100;
    return { amount: variance, percent: variancePercent };
  };

  const variance = getVariance();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push(`/productions/${productionId}`)}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2"
          >
            &#8592; Back to Production
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Budget Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">{production?.name || 'Production'}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/productions/${productionId}/export`)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Export PDF
              </button>
              <button
                onClick={() => router.push(`/productions/${productionId}/budget`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Edit Budget
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Total Budget</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.total || 0)}</div>
            {variance && (
              <div className={`text-sm mt-1 ${variance.amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {variance.amount >= 0 ? '+' : ''}{formatCurrency(variance.amount)} ({variance.percent.toFixed(1)}%)
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Above the Line</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary?.atl || 0)}</div>
            <div className="text-sm text-gray-400">
              {summary?.total ? formatPercentage((summary?.atl || 0) / summary.total) : '0%'} of total
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Below the Line</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.btl || 0)}</div>
            <div className="text-sm text-gray-400">
              {summary?.total ? formatPercentage((summary?.btl || 0) / summary.total) : '0%'} of total
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Post Production</div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary?.post || 0)}</div>
            <div className="text-sm text-gray-400">
              {summary?.total ? formatPercentage((summary?.post || 0) / summary.total) : '0%'} of total
            </div>
          </div>
        </div>

        {/* Budget vs Target */}
        {production?.budget_target && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Target</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Current: {formatCurrency(summary?.total || 0)}</span>
                <span>Target: {formatCurrency(production.budget_target)}</span>
              </div>
              <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (summary?.total || 0) > production.budget_target ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(((summary?.total || 0) / production.budget_target) * 100, 100)}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 text-center">
                {(summary?.total || 0) <= production.budget_target
                  ? `${formatCurrency(production.budget_target - (summary?.total || 0))} under target`
                  : `${formatCurrency((summary?.total || 0) - production.budget_target)} over target`}
              </div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
            <div className="space-y-3">
              {[
                { name: 'Development', amount: summary?.total ? summary.total * 0.02 : 0, color: 'bg-blue-500' },
                { name: 'Story Rights', amount: summary?.total ? summary.total * 0.05 : 0, color: 'bg-indigo-500' },
                { name: 'Cast', amount: summary?.atl ? summary.atl * 0.6 : 0, color: 'bg-purple-500' },
                { name: 'Direction', amount: summary?.atl ? summary.atl * 0.25 : 0, color: 'bg-pink-500' },
                { name: 'Production', amount: summary?.btl ? summary.btl * 0.35 : 0, color: 'bg-red-500' },
                { name: 'Camera', amount: summary?.btl ? summary.btl * 0.15 : 0, color: 'bg-orange-500' },
                { name: 'Art', amount: summary?.btl ? summary.btl * 0.2 : 0, color: 'bg-yellow-500' },
                { name: 'Post', amount: summary?.post || 0, color: 'bg-green-500' },
              ].filter(c => c.amount > 0).slice(0, 8).map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                  <div className="flex-1 flex justify-between">
                    <span className="text-sm text-gray-700">{cat.name}</span>
                    <span className="text-sm text-gray-500">{formatCurrency(cat.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Allocation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Allocation</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Above the Line</span>
                  <span>{summary?.total ? formatPercentage((summary?.atl || 0) / summary.total) : '0%'}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${summary?.total ? ((summary?.atl || 0) / summary.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Below the Line</span>
                  <span>{summary?.total ? formatPercentage((summary?.btl || 0) / summary.total) : '0%'}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${summary?.total ? ((summary?.btl || 0) / summary.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Post Production</span>
                  <span>{summary?.total ? formatPercentage((summary?.post || 0) / summary.total) : '0%'}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${summary?.total ? ((summary?.post || 0) / summary.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Fringes & Overhead</span>
                  <span>{summary?.total ? formatPercentage(((summary?.fringes || 0) + (summary?.overhead || 0)) / summary.total) : '0%'}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${summary?.total ? (((summary?.fringes || 0) + (summary?.overhead || 0)) / summary.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push(`/productions/${productionId}/guardian`)}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">&#128737;</div>
              <div className="font-medium text-gray-900">Run Audit</div>
              <div className="text-xs text-gray-500">Check compliance</div>
            </button>
            <button
              onClick={() => router.push(`/productions/${productionId}/what-if`)}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">&#128302;</div>
              <div className="font-medium text-gray-900">What-If</div>
              <div className="text-xs text-gray-500">Model scenarios</div>
            </button>
            <button
              onClick={() => router.push(`/productions/${productionId}/comparison`)}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">&#128200;</div>
              <div className="font-medium text-gray-900">Variance</div>
              <div className="text-xs text-gray-500">Track changes</div>
            </button>
            <button
              onClick={() => router.push(`/productions/${productionId}/views`)}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">&#128065;</div>
              <div className="font-medium text-gray-900">Views</div>
              <div className="text-xs text-gray-500">Filter budget</div>
            </button>
          </div>
        </div>

        {/* Old Way vs New Way */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Dashboard vs MMB Budget Info</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-red-600 font-medium">Old Way:</span>
              <span className="text-gray-600 ml-2">Static Budget Info window with basic totals only</span>
            </div>
            <div>
              <span className="text-green-600 font-medium">New Way:</span>
              <span className="text-gray-600 ml-2">Live dashboard with charts, variance tracking, and quick actions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
