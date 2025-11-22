'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app';

interface FilterOptions {
  departments: { name: string; count: number }[];
  unions: { name: string; count: number }[];
  accountCodeRange: { min: string; max: string; totalItems: number };
  budgetTotals: { total: number; atlTotal: number; btlTotal: number };
  atlBtlOptions: string[];
  presetViews: Record<string, PresetView>;
}

interface PresetView {
  name: string;
  description: string;
  icon: string;
  filters: Filters;
}

interface Filters {
  atl_or_btl?: string[];
  departments?: string[];
  unions?: string[];
  has_union?: boolean;
  account_code_range?: [string, string];
  account_code_prefix?: string;
  search?: string;
  min_total?: number;
  max_total?: number;
}

interface ViewResult {
  items: any[];
  summary: {
    itemCount: number;
    subtotal: number;
    fringes: number;
    total: number;
    atlTotal: number;
    btlTotal: number;
    departmentCount: number;
    unionCount: number;
  };
  departmentBreakdown: { department: string; itemCount: number; total: number }[];
}

interface SavedView {
  id: string;
  name: string;
  description?: string;
  filters: Filters;
  is_default: boolean;
  created_at: string;
}

export default function DynamicViewsPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeFilters, setActiveFilters] = useState<Filters>({});
  const [viewResult, setViewResult] = useState<ViewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');

  // Load filter options and saved views
  useEffect(() => {
    const loadData = async () => {
      try {
        const [optionsRes, viewsRes] = await Promise.all([
          fetch(`${API_URL}/api/productions/${productionId}/views/filter-options`),
          fetch(`${API_URL}/api/productions/${productionId}/views`)
        ]);

        const optionsData = await optionsRes.json();
        const viewsData = await viewsRes.json();

        if (optionsData.success) setFilterOptions(optionsData.data);
        if (viewsData.success) setSavedViews(viewsData.data);

        // Apply initial empty filter to get all items
        await applyFilters({});
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productionId]);

  const applyFilters = useCallback(async (filters: Filters) => {
    setApplying(true);
    try {
      const response = await fetch(`${API_URL}/api/productions/${productionId}/views/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });
      const data = await response.json();
      if (data.success) {
        setViewResult(data.data);
      }
    } catch (err) {
      console.error('Error applying filters:', err);
    } finally {
      setApplying(false);
    }
  }, [productionId]);

  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...activeFilters };

    if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    setActiveFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyPreset = (presetKey: string) => {
    if (!filterOptions?.presetViews[presetKey]) return;
    const preset = filterOptions.presetViews[presetKey];
    setActiveFilters(preset.filters);
    applyFilters(preset.filters);
  };

  const applySavedView = (view: SavedView) => {
    setActiveFilters(view.filters);
    applyFilters(view.filters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    applyFilters({});
  };

  const saveCurrentView = async () => {
    if (!newViewName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/productions/${productionId}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newViewName,
          description: newViewDescription,
          filters: activeFilters
        })
      });
      const data = await response.json();
      if (data.success) {
        setSavedViews(prev => [...prev, data.data]);
        setShowSaveModal(false);
        setNewViewName('');
        setNewViewDescription('');
      }
    } catch (err) {
      console.error('Error saving view:', err);
    }
  };

  const deleteView = async (viewId: string) => {
    if (!confirm('Delete this saved view?')) return;

    try {
      const response = await fetch(`${API_URL}/api/views/${viewId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setSavedViews(prev => prev.filter(v => v.id !== viewId));
      }
    } catch (err) {
      console.error('Error deleting view:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading views...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/productions/${productionId}/budget`)}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            &#8592; Back to Budget
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Dynamic Budget Views</h1>
          <p className="text-gray-600 mt-1">
            Filter and slice your budget data in real-time. Save views for quick access.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          <div className="col-span-3 space-y-4">
            {/* Preset Views */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Views</h3>
              <div className="space-y-2">
                {filterOptions?.presetViews && Object.entries(filterOptions.presetViews).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="w-full text-left p-2 rounded hover:bg-blue-50 transition text-sm"
                  >
                    <div className="font-medium text-gray-800">{preset.name}</div>
                    <div className="text-xs text-gray-500">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Views */}
            {savedViews.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Saved Views</h3>
                <div className="space-y-2">
                  {savedViews.map(view => (
                    <div
                      key={view.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                    >
                      <button
                        onClick={() => applySavedView(view)}
                        className="text-left flex-1"
                      >
                        <div className="font-medium text-gray-800 text-sm">{view.name}</div>
                        {view.description && (
                          <div className="text-xs text-gray-500">{view.description}</div>
                        )}
                      </button>
                      <button
                        onClick={() => deleteView(view.id)}
                        className="text-red-400 hover:text-red-600 text-xs ml-2"
                      >
                        &#10005;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800">
                    Clear all
                  </button>
                )}
              </div>

              {/* ATL/BTL Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <div className="flex gap-2">
                  {['ATL', 'BTL'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        const current = activeFilters.atl_or_btl || [];
                        const newValue = current.includes(type)
                          ? current.filter(t => t !== type)
                          : [...current, type];
                        handleFilterChange('atl_or_btl', newValue.length ? newValue : null);
                      }}
                      className={`px-3 py-1 text-sm rounded-full transition ${
                        activeFilters.atl_or_btl?.includes(type)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Filter */}
              {filterOptions?.departments && filterOptions.departments.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Departments</label>
                  <select
                    multiple
                    value={activeFilters.departments || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                      handleFilterChange('departments', selected.length ? selected : null);
                    }}
                    className="w-full border rounded p-2 text-sm h-24"
                  >
                    {filterOptions.departments.map(dept => (
                      <option key={dept.name} value={dept.name}>
                        {dept.name} ({dept.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Union Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Union Status</label>
                <select
                  value={activeFilters.has_union === undefined ? '' : String(activeFilters.has_union)}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleFilterChange('has_union', val === '' ? null : val === 'true');
                  }}
                  className="w-full border rounded p-2 text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Union Only</option>
                  <option value="false">Non-Union Only</option>
                </select>
              </div>

              {/* Search */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                <input
                  type="text"
                  value={activeFilters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value || null)}
                  placeholder="Search descriptions..."
                  className="w-full border rounded p-2 text-sm"
                />
              </div>

              {/* Save Button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="w-full bg-blue-600 text-white rounded py-2 text-sm hover:bg-blue-700 transition"
                >
                  Save This View
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="col-span-9">
            {/* Summary Cards */}
            {viewResult && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-xs text-gray-500 uppercase">Total</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(viewResult.summary.total)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {viewResult.summary.itemCount} items
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-xs text-blue-600 uppercase">ATL</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(viewResult.summary.atlTotal)}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-xs text-green-600 uppercase">BTL</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatCurrency(viewResult.summary.btlTotal)}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-xs text-purple-600 uppercase">Fringes</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(viewResult.summary.fringes)}
                    </div>
                  </div>
                </div>

                {/* Department Breakdown */}
                {viewResult.departmentBreakdown.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">By Department</h3>
                    <div className="space-y-2">
                      {viewResult.departmentBreakdown.map(dept => (
                        <div key={dept.department} className="flex items-center">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{dept.department}</span>
                              <span className="text-sm text-gray-600">{formatCurrency(dept.total)}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${(dept.total / viewResult.summary.total) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {viewResult.items.length} items
                      {activeFilterCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                        </span>
                      )}
                    </div>
                    {applying && (
                      <div className="text-xs text-gray-400 animate-pulse">Updating...</div>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Union</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewResult.items.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{item.account_code}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.department || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.union_local || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.rate || 0)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(item.total || 0)}
                            </td>
                          </tr>
                        ))}
                        {viewResult.items.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                              No items match your filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save View Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Save View</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Camera Department Only"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={newViewDescription}
                    onChange={(e) => setNewViewDescription(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Brief description..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCurrentView}
                    disabled={!newViewName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
