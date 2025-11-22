'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CategoryVariance {
  category_code: string;
  original: string;
  current: string;
  variance: string;
  variance_pct: string;
}

interface SignificantVariance {
  id: string;
  account_code: string;
  position_title: string;
  original: string;
  current: string;
  variance: string;
  variance_pct: string;
}

interface ComparisonResult {
  success: boolean;
  production: {
    id: string;
    name: string;
    budget_target: number | null;
    is_locked: boolean;
  };
  summary: {
    original_total: string;
    current_total: string;
    variance: string;
    variance_pct: string;
    status: 'OVER_BUDGET' | 'UNDER_BUDGET' | 'ON_BUDGET';
  };
  by_category: CategoryVariance[];
  significant_variances: SignificantVariance[];
  line_item_count: number;
}

export default function ComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [locking, setLocking] = useState(false);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/comparison`
      );
      if (!res.ok) throw new Error('Failed to fetch comparison');
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [productionId]);

  const handleLockOriginal = async () => {
    if (!confirm('This will set the current budget as the baseline for comparison. Continue?')) return;

    setLocking(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/lock-original`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to lock original');
      }
      fetchComparison();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLocking(false);
    }
  };

  const handleUnlock = async () => {
    if (!confirm('This will allow you to re-lock original totals. Continue?')) return;

    setLocking(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/unlock-original`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error('Failed to unlock');
      fetchComparison();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLocking(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getVarianceColor = (variance: string) => {
    const num = parseFloat(variance);
    if (num > 0) return 'text-red-600';
    if (num < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OVER_BUDGET':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Over Budget</span>;
      case 'UNDER_BUDGET':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Under Budget</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">On Budget</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading comparison...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2"
          >
            ← Back to Production
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Budget Comparison</h1>
              <p className="text-sm text-gray-600 mt-1">
                {result?.production.name || 'Production'} - Original vs Current
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {result?.production.is_locked ? (
                <button
                  onClick={handleUnlock}
                  disabled={locking}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  {locking ? 'Processing...' : 'Unlock Baseline'}
                </button>
              ) : (
                <button
                  onClick={handleLockOriginal}
                  disabled={locking}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {locking ? 'Processing...' : 'Lock Current as Baseline'}
                </button>
              )}
              <button
                onClick={fetchComparison}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {result && (
          <>
            {/* Lock Status */}
            {!result.production.is_locked && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-yellow-800">
                    No baseline locked. Click "Lock Current as Baseline" to set the original budget for comparison.
                  </span>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500">Original Budget</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(result.summary.original_total)}
                </div>
                <div className="text-xs text-gray-400 mt-1">Locked baseline</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500">Current Budget</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(result.summary.current_total)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {result.line_item_count} line items
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500">Variance</div>
                <div className={`text-2xl font-bold ${getVarianceColor(result.summary.variance)}`}>
                  {parseFloat(result.summary.variance) > 0 ? '+' : ''}
                  {formatCurrency(result.summary.variance)}
                </div>
                <div className={`text-sm ${getVarianceColor(result.summary.variance)}`}>
                  {parseFloat(result.summary.variance) > 0 ? '+' : ''}
                  {result.summary.variance_pct}%
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500">Status</div>
                <div className="mt-2">{getStatusBadge(result.summary.status)}</div>
                {result.production.budget_target && (
                  <div className="text-xs text-gray-400 mt-2">
                    Target: {formatCurrency(result.production.budget_target)}
                  </div>
                )}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Variance by Category</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Original</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.by_category.map((cat) => (
                      <tr key={cat.category_code} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.category_code}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(cat.original)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(cat.current)}</td>
                        <td className={`px-6 py-4 text-sm text-right font-medium ${getVarianceColor(cat.variance)}`}>
                          {parseFloat(cat.variance) > 0 ? '+' : ''}{formatCurrency(cat.variance)}
                        </td>
                        <td className={`px-6 py-4 text-sm text-right ${getVarianceColor(cat.variance)}`}>
                          {parseFloat(cat.variance_pct) > 0 ? '+' : ''}{cat.variance_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Significant Variances */}
            {result.significant_variances.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Significant Line Item Variances ({result.significant_variances.length})
                  </h2>
                  <p className="text-sm text-gray-500">Items with variance greater than $100</p>
                </div>
                <div className="divide-y divide-gray-200">
                  {result.significant_variances.map((item) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.account_code} - {item.position_title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(item.original)} → {formatCurrency(item.current)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getVarianceColor(item.variance)}`}>
                          {parseFloat(item.variance) > 0 ? '+' : ''}{formatCurrency(item.variance)}
                        </div>
                        <div className={`text-sm ${getVarianceColor(item.variance)}`}>
                          {parseFloat(item.variance_pct) > 0 ? '+' : ''}{item.variance_pct}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Variance Message */}
            {result.summary.status === 'ON_BUDGET' && parseFloat(result.summary.original_total) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <div className="text-green-600 text-4xl mb-4">✓</div>
                <h3 className="text-lg font-semibold text-green-800">On Budget!</h3>
                <p className="text-green-700 mt-2">
                  No significant variance between original and current budget.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
