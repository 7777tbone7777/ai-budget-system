'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app';

// Format currency
const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '$0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
};

// Format percentage
const formatPercent = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(1)}%`;
};

interface BudgetMetadata {
  id: string;
  production_id: string;
  budget_uuid: string;
  version_number: number;
  budget_type: string;
  budget_name: string | null;
  total_topsheet_categories: number;
  total_accounts: number;
  total_detail_lines: number;
  grand_total_subtotal: string;
  grand_total_fringe: string;
  grand_total: string;
  created_at: string;
  production_name?: string;
  production_type?: string;
}

interface TopsheetCategory {
  id: string;
  category_number: string;
  category_name: string;
  current_subtotal: string;
  current_fringe: string;
  current_total: string;
  variance_subtotal: string;
  variance_fringe: string;
  variance_total: string;
  is_amortized: boolean;
  amortization_episodes: number;
  sort_order: number;
}

interface Account {
  id: string;
  topsheet_category_id: string;
  account_code: string;
  account_name: string;
  current_subtotal: string;
  current_fringe: string;
  current_total: string;
  is_amortized: boolean;
  amortization_episodes: number;
  sort_order: number;
}

interface LineItem {
  id: string;
  account_id: string;
  line_number: string;
  description: string;
  quantity: string;
  unit_type: string;
  rate: string;
  rate_type: string;
  multiplier: string;
  current_subtotal: string;
  total_fringe_rate: string;
  current_fringe: string;
  current_total: string;
  union_local: string | null;
  fringe_breakdown: any;
  is_amortized: boolean;
  amortization_episodes: number;
  per_episode_cost: string;
  notes: string | null;
}

export default function BudgetViewerPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  const [metadata, setMetadata] = useState<BudgetMetadata | null>(null);
  const [topsheet, setTopsheet] = useState<TopsheetCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null);
  const [viewMode, setViewMode] = useState<'topsheet' | 'flat'>('topsheet');

  useEffect(() => {
    loadBudgetData();
  }, [budgetId]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all budget data in parallel
      const [metaRes, topsheetRes, accountsRes, lineItemsRes] = await Promise.all([
        axios.get(`${API_URL}/api/budgets/${budgetId}`),
        axios.get(`${API_URL}/api/budgets/${budgetId}/topsheet`),
        axios.get(`${API_URL}/api/budgets/${budgetId}/accounts`),
        axios.get(`${API_URL}/api/budgets/${budgetId}/line-items?limit=1000`),
      ]);

      setMetadata(metaRes.data.budget);
      setTopsheet(topsheetRes.data.topsheet || []);
      setAccounts(accountsRes.data.accounts || []);
      setLineItems(lineItemsRes.data.line_items || []);
    } catch (err: any) {
      console.error('Error loading budget:', err);
      setError(err.response?.data?.error || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const getAccountsForCategory = (categoryId: string) => {
    return accounts.filter(a => a.topsheet_category_id === categoryId);
  };

  const getLineItemsForAccount = (accountId: string) => {
    return lineItems.filter(li => li.account_id === accountId);
  };

  const calculateGrandTotal = () => {
    return topsheet.reduce((sum, cat) => sum + parseFloat(cat.current_total || '0'), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading budget...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 className="text-red-800 text-xl font-semibold mb-2">Error Loading Budget</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/productions')}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Productions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {metadata?.budget_name || `Budget v${metadata?.version_number}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {metadata?.production_name} • {metadata?.budget_type} •
            Created {new Date(metadata?.created_at || '').toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('topsheet')}
            className={`px-4 py-2 rounded ${viewMode === 'topsheet' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Hierarchy View
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`px-4 py-2 rounded ${viewMode === 'flat' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Flat View
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Subtotal</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(metadata?.grand_total_subtotal)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Fringes</div>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(metadata?.grand_total_fringe)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Grand Total</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(calculateGrandTotal())}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Line Items</div>
          <div className="text-2xl font-bold text-blue-600">
            {lineItems.length}
          </div>
          <div className="text-xs text-gray-400">
            {topsheet.length} categories • {accounts.length} accounts
          </div>
        </div>
      </div>

      {/* Budget Content */}
      {viewMode === 'topsheet' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Topsheet Header */}
          <div className="bg-gray-800 text-white px-4 py-3 grid grid-cols-12 gap-2 text-sm font-medium">
            <div className="col-span-1">Acct</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Subtotal</div>
            <div className="col-span-2 text-right">Fringes</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Topsheet Categories */}
          {topsheet.map((category) => (
            <div key={category.id} className="border-b border-gray-200">
              {/* Category Row */}
              <div
                onClick={() => toggleCategory(category.id)}
                className="px-4 py-3 grid grid-cols-12 gap-2 bg-blue-50 hover:bg-blue-100 cursor-pointer items-center"
              >
                <div className="col-span-1 font-bold text-blue-800">
                  {category.category_number}
                </div>
                <div className="col-span-5 font-semibold text-blue-900 flex items-center gap-2">
                  <span className={`transform transition-transform ${expandedCategories.has(category.id) ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                  {category.category_name}
                  <span className="text-xs text-blue-600 font-normal">
                    ({getAccountsForCategory(category.id).length} accounts)
                  </span>
                </div>
                <div className="col-span-2 text-right font-medium">
                  {formatCurrency(category.current_subtotal)}
                </div>
                <div className="col-span-2 text-right text-orange-600">
                  {formatCurrency(category.current_fringe)}
                </div>
                <div className="col-span-2 text-right font-bold text-blue-900">
                  {formatCurrency(category.current_total)}
                </div>
              </div>

              {/* Accounts (expanded) */}
              {expandedCategories.has(category.id) && (
                <div className="bg-gray-50">
                  {getAccountsForCategory(category.id).map((account) => (
                    <div key={account.id}>
                      {/* Account Row */}
                      <div
                        onClick={() => toggleAccount(account.id)}
                        className="px-4 py-2 grid grid-cols-12 gap-2 hover:bg-gray-100 cursor-pointer items-center border-l-4 border-blue-300 ml-4"
                      >
                        <div className="col-span-1 font-medium text-gray-700">
                          {account.account_code}
                        </div>
                        <div className="col-span-5 text-gray-800 flex items-center gap-2 pl-4">
                          <span className={`transform transition-transform text-xs ${expandedAccounts.has(account.id) ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                          {account.account_name}
                          <span className="text-xs text-gray-500">
                            ({getLineItemsForAccount(account.id).length} items)
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          {formatCurrency(account.current_subtotal)}
                        </div>
                        <div className="col-span-2 text-right text-orange-500">
                          {formatCurrency(account.current_fringe)}
                        </div>
                        <div className="col-span-2 text-right font-semibold">
                          {formatCurrency(account.current_total)}
                        </div>
                      </div>

                      {/* Line Items (expanded) */}
                      {expandedAccounts.has(account.id) && (
                        <div className="bg-white ml-8 border-l-2 border-gray-200">
                          {getLineItemsForAccount(account.id).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedLineItem(item)}
                              className="px-4 py-2 grid grid-cols-12 gap-2 hover:bg-yellow-50 cursor-pointer text-sm items-center border-b border-gray-100"
                            >
                              <div className="col-span-1 text-gray-500 text-xs">
                                {item.line_number}
                              </div>
                              <div className="col-span-5 pl-4">
                                <div className="text-gray-800">{item.description}</div>
                                <div className="text-xs text-gray-500">
                                  {item.quantity} {item.unit_type} × {formatCurrency(item.rate)}/{item.rate_type}
                                  {item.union_local && ` • ${item.union_local}`}
                                </div>
                              </div>
                              <div className="col-span-2 text-right text-gray-700">
                                {formatCurrency(item.current_subtotal)}
                              </div>
                              <div className="col-span-2 text-right text-orange-500 text-xs">
                                {formatCurrency(item.current_fringe)}
                                <div className="text-gray-400">
                                  ({formatPercent(item.total_fringe_rate)})
                                </div>
                              </div>
                              <div className="col-span-2 text-right font-medium">
                                {formatCurrency(item.current_total)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Grand Total Row */}
          <div className="px-4 py-4 grid grid-cols-12 gap-2 bg-gray-900 text-white font-bold">
            <div className="col-span-1"></div>
            <div className="col-span-5">GRAND TOTAL</div>
            <div className="col-span-2 text-right">
              {formatCurrency(topsheet.reduce((sum, c) => sum + parseFloat(c.current_subtotal || '0'), 0))}
            </div>
            <div className="col-span-2 text-right text-orange-300">
              {formatCurrency(topsheet.reduce((sum, c) => sum + parseFloat(c.current_fringe || '0'), 0))}
            </div>
            <div className="col-span-2 text-right text-green-300">
              {formatCurrency(calculateGrandTotal())}
            </div>
          </div>
        </div>
      ) : (
        /* Flat View - All Line Items */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-3 text-sm font-medium">
            All Line Items ({lineItems.length})
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Line #</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Union</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Rate</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Fringe %</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lineItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedLineItem(item)}
                  className="hover:bg-yellow-50 cursor-pointer"
                >
                  <td className="px-4 py-2 text-sm text-gray-500">{item.line_number}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{item.union_local || '-'}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.rate)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.current_subtotal)}</td>
                  <td className="px-4 py-2 text-sm text-right text-orange-600">{formatPercent(item.total_fringe_rate)}</td>
                  <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.current_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Line Item Detail Modal */}
      {selectedLineItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Line Item Details</h2>
              <button
                onClick={() => setSelectedLineItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="text-sm text-gray-500">Description</div>
                <div className="text-lg font-semibold">{selectedLineItem.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Line Number</div>
                  <div className="font-medium">{selectedLineItem.line_number}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Union Local</div>
                  <div className="font-medium">{selectedLineItem.union_local || 'Non-Union'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Quantity</div>
                  <div className="font-medium">{selectedLineItem.quantity} {selectedLineItem.unit_type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Rate</div>
                  <div className="font-medium">{formatCurrency(selectedLineItem.rate)}/{selectedLineItem.rate_type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Multiplier</div>
                  <div className="font-medium">{selectedLineItem.multiplier}x</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Calculation</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({selectedLineItem.quantity} × {formatCurrency(selectedLineItem.rate)} × {selectedLineItem.multiplier})</span>
                    <span className="font-medium">{formatCurrency(selectedLineItem.current_subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Fringes ({formatPercent(selectedLineItem.total_fringe_rate)})</span>
                    <span className="font-medium">{formatCurrency(selectedLineItem.current_fringe)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(selectedLineItem.current_total)}</span>
                  </div>
                </div>
              </div>

              {selectedLineItem.is_amortized && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-700 mb-1">Amortization</div>
                  <div className="text-sm">
                    {formatCurrency(selectedLineItem.per_episode_cost)} per episode
                    ({selectedLineItem.amortization_episodes} episodes)
                  </div>
                </div>
              )}

              {selectedLineItem.fringe_breakdown && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Fringe Breakdown</div>
                  <div className="bg-orange-50 rounded-lg p-3 text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedLineItem.fringe_breakdown, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLineItem.notes && (
                <div>
                  <div className="text-sm text-gray-500">Notes</div>
                  <div className="text-gray-700">{selectedLineItem.notes}</div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedLineItem(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
