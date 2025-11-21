'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface BudgetTemplate {
  id: number;
  name: string;
  location: string;
  production_type: string;
  total_budget: number;
  department_count: number;
  line_item_count: number;
  completeness_score: number;
  shoot_days: number | null;
}

export default function ApplyTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<BudgetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  // Budget scaling
  const [scaleToBudget, setScaleToBudget] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters();
  }, [templates, locationFilter, typeFilter, budgetMin, budgetMax]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/templates`);
      if (!res.ok) throw new Error('Failed to fetch templates');

      const data = await res.json();
      setTemplates(data.templates || []);
      setFilteredTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...templates];

    if (locationFilter) {
      filtered = filtered.filter(t =>
        t.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(t => t.production_type === typeFilter);
    }

    if (budgetMin) {
      filtered = filtered.filter(t => t.total_budget >= parseFloat(budgetMin));
    }

    if (budgetMax) {
      filtered = filtered.filter(t => t.total_budget <= parseFloat(budgetMax));
    }

    setFilteredTemplates(filtered);
  };

  const handleApplyTemplate = async (template: BudgetTemplate) => {
    if (!confirm(`Apply template "${template.name}" to this production? This will create ${template.department_count} budget groups and ${template.line_item_count} line items.`)) {
      return;
    }

    try {
      setApplying(template.id);
      setError(null);

      const payload: any = {
        template_id: template.id
      };

      if (scaleToBudget) {
        payload.scale_to_budget = parseFloat(scaleToBudget);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/apply-template`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to apply template');
      }

      const result = await res.json();

      alert(`Template applied successfully!\n\nGroups created: ${result.groups_created}\nLine items created: ${result.items_created}\nScale factor: ${result.scale_factor}`);

      // Redirect to budget page
      router.push(`/productions/${productionId}/budget`);
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setApplying(null);
    }
  };

  const clearFilters = () => {
    setLocationFilter('');
    setTypeFilter('');
    setBudgetMin('');
    setBudgetMax('');
  };

  // Get unique locations and types for filter dropdowns
  const uniqueLocations = Array.from(new Set(templates.map(t => t.location))).sort();
  const uniqueTypes = Array.from(new Set(templates.map(t => t.production_type))).sort();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProductionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'one_hour_pilot': 'One Hour Pilot',
      'multi_cam': 'Multi-Cam',
      'cable_series': 'Cable Series',
      'pattern_budget': 'Pattern Budget',
      'amortization': 'Amortization',
      'unknown': 'Unknown'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Production
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Apply Budget Template</h1>
          <p className="mt-2 text-gray-600">
            Choose from {templates.length} real production budgets to quickly build your budget
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {(locationFilter || typeFilter || budgetMin || budgetMax) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Locations</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Production Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{getProductionTypeLabel(type)}</option>
                ))}
              </select>
            </div>

            {/* Budget Min */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Budget
              </label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="e.g., 5000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Budget Max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Budget
              </label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="e.g., 10000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Budget Scaling */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scale Template to Budget (Optional)
            </label>
            <input
              type="number"
              value={scaleToBudget}
              onChange={(e) => setScaleToBudget(e.target.value)}
              placeholder="e.g., 8000000 (will proportionally scale all amounts)"
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              If specified, all budget amounts will be scaled proportionally to match this total
            </p>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredTemplates.length} of {templates.length} templates
          </p>
        </div>

        {/* Template Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600">No templates match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {template.location}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                      {getProductionTypeLabel(template.production_type)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Budget:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(template.total_budget)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Departments:</span>
                    <span className="font-semibold text-gray-900">
                      {template.department_count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Line Items:</span>
                    <span className="font-semibold text-gray-900">
                      {template.line_item_count}
                    </span>
                  </div>
                  {template.shoot_days && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shoot Days:</span>
                      <span className="font-semibold text-gray-900">
                        {template.shoot_days}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completeness:</span>
                    <span className="font-semibold text-gray-900">
                      {template.completeness_score.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyTemplate(template)}
                  disabled={applying === template.id}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {applying === template.id ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Applying...
                    </span>
                  ) : (
                    'Apply Template'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
