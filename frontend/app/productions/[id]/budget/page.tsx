'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import MultiPeriodForm from './MultiPeriodForm';
import CalculationPanel from '../../../../components/CalculationPanel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app';

// Budget info response type
interface BudgetInfo {
  has_budget: boolean;
  budget: {
    id: string;
    version_number: number;
    budget_type: string;
    total_topsheet_categories: number;
    total_accounts: number;
    total_detail_lines: number;
  } | null;
}

// Currency formatting helper
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0.00';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Format number with commas for display
const formatNumberWithCommas = (value: string | number): string => {
  const num = typeof value === 'string' ? value.replace(/,/g, '') : value.toString();
  if (!num || isNaN(Number(num))) return '';
  return Number(num).toLocaleString('en-US');
};

// Format quantity (remove trailing .00 for whole numbers)
const formatQuantity = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
};

// Helper to get values from either old or new column names
// Check for non-zero values first before falling back to alternate columns
const getLineItemValues = (item: any) => ({
  subtotal: parseFloat(
    (item.current_subtotal > 0 ? item.current_subtotal : item.subtotal)?.toString() || '0'
  ),
  fringes: parseFloat(
    (item.fringes > 0 ? item.fringes : item.current_fringe > 0 ? item.current_fringe : item.fringe)?.toString() || '0'
  ),
  total: parseFloat(
    (item.current_total > 0 ? item.current_total : item.total)?.toString() || '0'
  ),
  accountCode: item.account_code || item.line_number || '-',
});

interface LineItem {
  id: string;
  account_code: string;
  line_number?: string;
  description: string;
  position_title?: string;
  union_local?: string;
  department?: string;
  atl_or_btl?: string;
  quantity: number;
  rate: number;
  // Support both old and new column names
  subtotal?: number;
  fringes?: number;
  total?: number;
  current_subtotal?: number;
  current_fringe?: number;
  current_total?: number;
  total_fringe_rate?: number;
  per_episode_cost?: number;
  notes?: string;
  parent_id?: string | null;
  is_parent?: boolean;
  children?: LineItem[];
}

interface QuickAddState {
  parentId: string;
  parentDescription: string;
  isOpen: boolean;
}

interface Sideletter {
  id: string;
  sideletter_name: string;
  wage_adjustment_pct?: string;
  holiday_pay_pct?: string;
  vacation_pay_pct?: string;
}

interface Production {
  id: string;
  name: string;
  production_type: string;
  distribution_platform?: string;
  shooting_location?: string;
  state?: string;
  budget_target?: number;
  applied_sideletters?: Sideletter[];
  principal_photography_start?: string;
  // Production schedule
  prep_weeks?: number;
  shoot_weeks?: number;
  post_weeks?: number;
}

interface RateCard {
  id: string;
  union_local: string;
  job_classification: string;
  rate_type: string;
  base_rate: number;
  location?: string;
  production_type?: string;
}

export default function ProductionBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [production, setProduction] = useState<Production | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [quickAdd, setQuickAdd] = useState<QuickAddState>({ parentId: '', parentDescription: '', isOpen: false });
  const [quickAddForm, setQuickAddForm] = useState({ description: '', quantity: 1, rate: 0 });

  // Budget hierarchy state
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);
  const [checkingBudget, setCheckingBudget] = useState(true);
  const [initializingBudget, setInitializingBudget] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    account_code: '',
    description: '',
    union_local: '',
    job_classification: '',
    quantity: 1,
    rate_override: ''
  });

  // Multi-period tracking state
  const [usePeriods, setUsePeriods] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [periods, setPeriods] = useState({
    prep: { days: 0, hours_per_day: 0, rate: 0 },
    shoot: { days: 0, hours_per_day: 0, rate: 0 },
    hiatus: { days: 0, hours_per_day: 0, rate: 0 },
    wrap: { days: 0, hours_per_day: 0, rate: 0 },
    holiday: { days: 0, hours_per_day: 0, rate: 0 }
  });

  // Summary totals
  const [totals, setTotals] = useState({
    atl: 0,
    btl: 0,
    other: 0,
    grand_total: 0
  });

  // Check if a budget hierarchy exists and redirect to new budget viewer if so
  useEffect(() => {
    const checkBudgetHierarchy = async () => {
      try {
        setCheckingBudget(true);
        const response = await axios.get(`${API_URL}/api/productions/${productionId}/budget-info`);
        setBudgetInfo(response.data);

        // If a budget with line items exists in the hierarchy, redirect to the new budget viewer
        if (response.data.has_budget && response.data.budget?.total_detail_lines > 0) {
          router.push(`/budgets/${response.data.budget.id}`);
          return;
        }
      } catch (error) {
        console.error('Error checking budget hierarchy:', error);
        // Continue with legacy view if check fails
      } finally {
        setCheckingBudget(false);
      }
    };

    checkBudgetHierarchy();
  }, [productionId, router]);

  // Initialize budget hierarchy
  const handleInitializeBudget = async () => {
    try {
      setInitializingBudget(true);
      const response = await axios.post(`${API_URL}/api/productions/${productionId}/initialize-budget`, {
        template: 'theatrical',
        include_accounts: true
      });

      if (response.data.success) {
        // Redirect to the new budget hierarchy viewer
        router.push(`/budgets/${response.data.budget_id}`);
      } else {
        alert('Failed to initialize budget: ' + response.data.error);
      }
    } catch (error: any) {
      console.error('Error initializing budget:', error);
      alert('Failed to initialize budget: ' + (error.response?.data?.error || error.message));
    } finally {
      setInitializingBudget(false);
    }
  };

  useEffect(() => {
    // Only load legacy data if not redirecting to new budget viewer
    if (!checkingBudget && (!budgetInfo?.has_budget || budgetInfo?.budget?.total_detail_lines === 0)) {
      loadData();
    }
  }, [productionId, checkingBudget, budgetInfo]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load production details, line items (with children tree), and rate cards in parallel
      const [prodRes, lineItemsRes, rateCardsRes] = await Promise.all([
        axios.get(`${API_URL}/api/productions/${productionId}`),
        axios.get(`${API_URL}/api/productions/${productionId}/line-items/tree`),
        axios.get(`${API_URL}/api/rate-cards`)
      ]);

      setProduction(prodRes.data.data);
      // Tree endpoint returns items in 'items' array with nested children
      setLineItems(lineItemsRes.data.items || []);
      setRateCards(rateCardsRes.data.data || []);

      // Calculate totals
      calculateTotals(lineItemsRes.data.items || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: LineItem[]) => {
    const newTotals = {
      atl: 0,
      btl: 0,
      other: 0,
      grand_total: 0
    };

    items.forEach(item => {
      // Support both old and new column names
      const total = parseFloat(item.current_total?.toString() || item.total?.toString() || '0');
      if (item.atl_or_btl === 'ATL') {
        newTotals.atl += total;
      } else if (item.atl_or_btl === 'BTL') {
        newTotals.btl += total;
      } else {
        newTotals.other += total;
      }
    });

    newTotals.grand_total = newTotals.atl + newTotals.btl + newTotals.other;
    setTotals(newTotals);
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleChildAdded = () => {
    loadData(); // Refresh data when a child is added from the panel
  };

  // Quick add modal handlers
  const openQuickAdd = (parentId: string, parentDescription: string) => {
    setQuickAdd({ parentId, parentDescription, isOpen: true });
    setQuickAddForm({ description: '', quantity: 1, rate: 0 });
    // Also expand the parent to show the new child once added
    setExpandedItems(prev => new Set(prev).add(parentId));
  };

  const closeQuickAdd = () => {
    setQuickAdd({ parentId: '', parentDescription: '', isOpen: false });
    setQuickAddForm({ description: '', quantity: 1, rate: 0 });
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAdd.parentId || !quickAddForm.description) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/line-items/${quickAdd.parentId}/children`,
        quickAddForm
      );

      if (response.data.success) {
        closeQuickAdd();
        await loadData(); // Refresh to show new child
      }
    } catch (error: any) {
      console.error('Error adding sub-item:', error);
      alert('Failed to add sub-item: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddLineItem = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/productions/${productionId}/line-items`,
        {
          account_code: formData.account_code,
          description: formData.description,
          union_local: formData.union_local || undefined,
          job_classification: formData.job_classification || undefined,
          quantity: parseFloat(formData.quantity.toString()) || 1,
          rate_override: formData.rate_override ? parseFloat(formData.rate_override) : undefined,
          location: production?.shooting_location,
          production_type: production?.production_type,
          // Multi-period support
          use_periods: usePeriods,
          periods: usePeriods ? periods : undefined
        }
      );

      // Reload line items
      await loadData();

      // Reset form
      setFormData({
        account_code: '',
        description: '',
        union_local: '',
        job_classification: '',
        quantity: 1,
        rate_override: ''
      });
      setUsePeriods(false);
      setPeriods({
        prep: { days: 0, hours_per_day: 0, rate: 0 },
        shoot: { days: 0, hours_per_day: 0, rate: 0 },
        hiatus: { days: 0, hours_per_day: 0, rate: 0 },
        wrap: { days: 0, hours_per_day: 0, rate: 0 },
        holiday: { days: 0, hours_per_day: 0, rate: 0 }
      });
      setShowAddForm(false);

      alert(`Line item created! Rate used: $${response.data.calculations.rate_used}, Total: $${response.data.calculations.total.toFixed(2)}`);
    } catch (error: any) {
      console.error('Error creating line item:', error);
      alert('Failed to create line item: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteLineItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;

    try {
      await axios.delete(`${API_URL}/api/line-items/${id}`);
      await loadData();
    } catch (error) {
      console.error('Error deleting line item:', error);
      alert('Failed to delete line item');
    }
  };

  const handleAutoGenerateBudget = async () => {
    if (lineItems.length > 0) {
      if (!confirm('This will replace all existing line items. Are you sure you want to auto-generate a new budget?')) {
        return;
      }
    }

    try {
      setGenerating(true);
      const response = await axios.post(`${API_URL}/api/productions/${productionId}/auto-generate-budget`);

      if (response.data.success) {
        await loadData();
        alert(`Budget auto-generated!\n\n${response.data.itemsCreated} line items created\nEstimated Total: $${formatCurrency(response.data.estimatedTotal)}\n\nMeal Penalty: ${response.data.mealPenalty ? `$${response.data.mealPenalty.rate}/violation after ${response.data.mealPenalty.deadline}` : 'N/A'}`);
      } else {
        alert('Failed to generate budget: ' + response.data.error);
      }
    } catch (error: any) {
      console.error('Error auto-generating budget:', error);
      alert('Failed to auto-generate budget: ' + (error.response?.data?.error || error.message));
    } finally {
      setGenerating(false);
    }
  };

  // Get unique unions from rate cards
  const uniqueUnions = Array.from(new Set(rateCards.map(rc => rc.union_local))).sort();

  // Get job classifications for selected union
  const availableJobs = formData.union_local
    ? rateCards
        .filter(rc => rc.union_local === formData.union_local)
        .map(rc => rc.job_classification)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort()
    : [];

  if (checkingBudget || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">
            {checkingBudget ? 'Checking budget status...' : 'Loading budget...'}
          </div>
        </div>
      </div>
    );
  }

  if (!production) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Production not found</div>
      </div>
    );
  }

  const groupedItems = {
    atl: lineItems.filter(item => item.atl_or_btl === 'ATL'),
    btl: lineItems.filter(item => item.atl_or_btl === 'BTL'),
    other: lineItems.filter(item => !item.atl_or_btl || (item.atl_or_btl !== 'ATL' && item.atl_or_btl !== 'BTL'))
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content */}
      <div className={`flex-1 p-8 transition-all duration-300 ${selectedItemId ? 'pr-4' : ''}`}>
      <div className={`mx-auto ${selectedItemId ? 'max-w-5xl' : 'max-w-7xl'}`}>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/productions')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Productions
          </button>
          <h1 className="text-4xl font-bold text-gray-900">
            {production.name}
          </h1>
          <div className="mt-2 text-gray-600 space-x-4">
            <span>Type: {production.production_type}</span>
            {production.distribution_platform && <span>• Platform: {production.distribution_platform}</span>}
            {production.shooting_location && <span>• Location: {production.shooting_location}</span>}
            {production.budget_target && <span>• Target: ${formatCurrency(production.budget_target)}</span>}
            {production.principal_photography_start && (
              <span>• Start: {new Date(production.principal_photography_start).toLocaleDateString()}</span>
            )}
          </div>
          {/* Applied Sideletters */}
          {production.applied_sideletters && production.applied_sideletters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Sideletters:</span>
              {production.applied_sideletters.map((sl) => (
                <span
                  key={sl.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  title={`Wage Adj: ${sl.wage_adjustment_pct || '0'}%, Holiday: ${sl.holiday_pay_pct || '100'}%, Vacation: ${sl.vacation_pay_pct || '100'}%`}
                >
                  {sl.sideletter_name}
                  {sl.wage_adjustment_pct && sl.wage_adjustment_pct !== '0.00' && (
                    <span className="ml-1 text-purple-600">({sl.wage_adjustment_pct}%)</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-sm text-blue-600 font-medium">Above the Line</div>
            <div className="text-3xl font-bold text-blue-900">${formatCurrency(totals.atl)}</div>
            <div className="text-sm text-blue-700 mt-1">{groupedItems.atl.length} items</div>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <div className="text-sm text-green-600 font-medium">Below the Line</div>
            <div className="text-3xl font-bold text-green-900">${formatCurrency(totals.btl)}</div>
            <div className="text-sm text-green-700 mt-1">{groupedItems.btl.length} items</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="text-sm text-purple-600 font-medium">Other</div>
            <div className="text-3xl font-bold text-purple-900">${formatCurrency(totals.other)}</div>
            <div className="text-sm text-purple-700 mt-1">{groupedItems.other.length} items</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-6">
            <div className="text-sm text-orange-600 font-medium">Grand Total</div>
            <div className="text-3xl font-bold text-orange-900">${formatCurrency(totals.grand_total)}</div>
            <div className="text-sm text-orange-700 mt-1">{lineItems.length} total items</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {showAddForm ? 'Cancel' : '+ Add Line Item'}
          </button>
          <button
            onClick={handleAutoGenerateBudget}
            disabled={generating}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-green-400 flex items-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              'Auto-Generate Budget'
            )}
          </button>
        </div>

        {/* Add Line Item Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Budget Line Item</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Code
                </label>
                <input
                  type="text"
                  value={formData.account_code}
                  onChange={(e) => setFormData({...formData, account_code: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 2800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Camera Operator - 10 weeks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Union Local (for automatic rate lookup)
                </label>
                <select
                  value={formData.union_local}
                  onChange={(e) => setFormData({...formData, union_local: e.target.value, job_classification: ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select union...</option>
                  {uniqueUnions.map(union => (
                    <option key={union} value={union}>{union}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Classification
                </label>
                <select
                  value={formData.job_classification}
                  onChange={(e) => setFormData({...formData, job_classification: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  disabled={!formData.union_local}
                >
                  <option value="">Select job...</option>
                  {availableJobs.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (weeks/days/units)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Override (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={formData.rate_override ? formatNumberWithCommas(formData.rate_override) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                        setFormData({...formData, rate_override: raw});
                      }
                    }}
                    className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-md"
                    placeholder="Leave blank for automatic lookup"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Period Tracking Toggle */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePeriods}
                  onChange={(e) => setUsePeriods(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Use Multi-Period Breakdown</span>
                  <p className="text-xs text-gray-500">
                    Professional budgets break costs by Prep/Shoot/Hiatus/Wrap/Holiday
                  </p>
                </div>
              </label>
            </div>

            {/* Multi-Period Form */}
            {usePeriods && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <MultiPeriodForm
                  periods={periods}
                  onPeriodsChange={setPeriods}
                  baseRate={formData.rate_override ? parseFloat(formData.rate_override) : undefined}
                />
              </div>
            )}

            <button
              onClick={handleAddLineItem}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium mt-4"
            >
              Create Line Item
            </button>
          </div>
        )}

        {/* Budget Line Items - ATL */}
        {groupedItems.atl.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Above the Line</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Union</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Budget</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedItems.atl.map((item) => {
                    const vals = getLineItemValues(item);
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedItems.has(item.id);

                    return (
                      <React.Fragment key={item.id}>
                        {/* Parent Row */}
                        <tr
                          onClick={() => setSelectedItemId(item.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedItemId === item.id
                              ? 'bg-blue-50 border-l-4 border-l-blue-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExpanded(item.id); }}
                                className={`w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${hasChildren ? '' : 'invisible'}`}
                              >
                                {isExpanded ? '▼' : '►'}
                              </button>
                              {vals.accountCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              {item.description}
                              {hasChildren && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  {item.children?.length} sub-items
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.union_local || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${formatCurrency(item.rate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${formatCurrency(vals.subtotal)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${formatCurrency(vals.total)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                            {production?.budget_target
                              ? ((vals.total / parseFloat(production.budget_target.toString())) * 100).toFixed(2)
                              : '0.00'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); openQuickAdd(item.id, item.description); }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title="Add sub-item"
                              >
                                +
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteLineItem(item.id); }}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Child Rows (when expanded) */}
                        {isExpanded && hasChildren && item.children?.map((child, idx) => {
                          const childVals = getLineItemValues(child);
                          return (
                            <tr
                              key={child.id}
                              onClick={() => setSelectedItemId(child.id)}
                              className={`bg-gray-50 cursor-pointer transition-colors ${
                                selectedItemId === child.id
                                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 pl-12">
                                <span className="text-gray-300">└</span> {idx + 1}
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-700">{child.description}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{child.union_local || '-'}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(child.rate)}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(childVals.subtotal)}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-700 text-right">${formatCurrency(childVals.total)}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
                              <td className="px-6 py-3 whitespace-nowrap text-right">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteLineItem(child.id); }}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right text-xl font-bold text-gray-900">
              ATL Subtotal: ${formatCurrency(totals.atl)}
            </div>
          </div>
        )}

        {/* Budget Line Items - BTL */}
        {groupedItems.btl.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Below the Line</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Union</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Budget</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedItems.btl.map((item) => {
                    const vals = getLineItemValues(item);
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedItems.has(item.id);

                    return (
                      <React.Fragment key={item.id}>
                        {/* Parent Row */}
                        <tr
                          onClick={() => setSelectedItemId(item.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedItemId === item.id
                              ? 'bg-blue-50 border-l-4 border-l-blue-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExpanded(item.id); }}
                                className={`w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${hasChildren ? '' : 'invisible'}`}
                              >
                                {isExpanded ? '▼' : '►'}
                              </button>
                              {vals.accountCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              {item.description}
                              {hasChildren && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  {item.children?.length} sub-items
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.department || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.union_local || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${formatCurrency(item.rate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${formatCurrency(vals.subtotal)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${formatCurrency(vals.total)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                            {production?.budget_target
                              ? ((vals.total / parseFloat(production.budget_target.toString())) * 100).toFixed(2)
                              : '0.00'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); openQuickAdd(item.id, item.description); }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title="Add sub-item"
                              >
                                +
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteLineItem(item.id); }}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Child Rows (when expanded) */}
                        {isExpanded && hasChildren && item.children?.map((child, idx) => {
                          const childVals = getLineItemValues(child);
                          return (
                            <tr
                              key={child.id}
                              onClick={() => setSelectedItemId(child.id)}
                              className={`bg-gray-50 cursor-pointer transition-colors ${
                                selectedItemId === child.id
                                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 pl-12">
                                <span className="text-gray-300">└</span> {idx + 1}
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-700">{child.description}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{child.department || '-'}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{child.union_local || '-'}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(child.rate)}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(childVals.subtotal)}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-700 text-right">${formatCurrency(childVals.total)}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
                              <td className="px-6 py-3 whitespace-nowrap text-right">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteLineItem(child.id); }}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right text-xl font-bold text-gray-900">
              BTL Subtotal: ${formatCurrency(totals.btl)}
            </div>
          </div>
        )}

        {/* Other Line Items */}
        {groupedItems.other.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Other</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Budget</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedItems.other.map((item) => {
                    const vals = getLineItemValues(item);
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedItems.has(item.id);

                    return (
                      <React.Fragment key={item.id}>
                        {/* Parent Row */}
                        <tr
                          onClick={() => setSelectedItemId(item.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedItemId === item.id
                              ? 'bg-blue-50 border-l-4 border-l-blue-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExpanded(item.id); }}
                                className={`w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${hasChildren ? '' : 'invisible'}`}
                              >
                                {isExpanded ? '▼' : '►'}
                              </button>
                              {vals.accountCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              {item.description}
                              {hasChildren && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  {item.children?.length} sub-items
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${formatCurrency(item.rate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${formatCurrency(vals.total)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                            {production?.budget_target
                              ? ((vals.total / parseFloat(production.budget_target.toString())) * 100).toFixed(2)
                              : '0.00'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); openQuickAdd(item.id, item.description); }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title="Add sub-item"
                              >
                                +
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteLineItem(item.id); }}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Child Rows (when expanded) */}
                        {isExpanded && hasChildren && item.children?.map((child, idx) => {
                          const childVals = getLineItemValues(child);
                          return (
                            <tr
                              key={child.id}
                              onClick={() => setSelectedItemId(child.id)}
                              className={`bg-gray-50 cursor-pointer transition-colors ${
                                selectedItemId === child.id
                                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 pl-12">
                                <span className="text-gray-300">└</span> {idx + 1}
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-700">{child.description}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(child.rate)}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-700 text-right">${formatCurrency(childVals.total)}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
                              <td className="px-6 py-3 whitespace-nowrap text-right">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteLineItem(child.id); }}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State with Budget Initialization Option */}
        {lineItems.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Budget Line Items Yet</h3>
            <p className="text-gray-600 mb-6">
              Choose how you want to set up your budget:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* New Hierarchy Budget Option */}
              <div className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 transition-colors">
                <div className="text-blue-600 text-4xl mb-3">🏗️</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Professional Budget Structure</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Initialize a full 4-level budget hierarchy with 34 standard categories and 100+ account codes.
                </p>
                <button
                  onClick={handleInitializeBudget}
                  disabled={initializingBudget}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
                >
                  {initializingBudget ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Initializing...
                    </>
                  ) : (
                    'Initialize Professional Budget'
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">Recommended for film & TV productions</p>
              </div>

              {/* Quick Add Option */}
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <div className="text-gray-500 text-4xl mb-3">⚡</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Quick Add Mode</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Add line items manually or use the Auto-Generate feature for quick estimates.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Add Line Item Manually
                </button>
                <p className="text-xs text-gray-500 mt-2">Good for quick estimates or simple budgets</p>
              </div>
            </div>
          </div>
        )}

        {/* Grand Total */}
        {lineItems.length > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg p-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-medium opacity-90">Production Budget Total</div>
                <div className="text-5xl font-bold mt-2">${formatCurrency(totals.grand_total)}</div>
                {production.budget_target && (
                  <div className="text-sm mt-2 opacity-90">
                    Target: ${formatCurrency(production.budget_target)}
                    {' '}
                    ({((totals.grand_total / production.budget_target) * 100).toFixed(1)}% of target)
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">ATL: ${formatCurrency(totals.atl)}</div>
                <div className="text-sm opacity-90">BTL: ${formatCurrency(totals.btl)}</div>
                <div className="text-sm opacity-90">Other: ${formatCurrency(totals.other)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Quick Add Modal */}
      {quickAdd.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Cast Member</h3>
              <button onClick={closeQuickAdd} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Adding to: <span className="font-medium">{quickAdd.parentDescription}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name / Description
                </label>
                <input
                  type="text"
                  value={quickAddForm.description}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Lead #1, Supporting Actor #2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weeks/Days
                  </label>
                  <input
                    type="number"
                    value={quickAddForm.quantity}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate ($)
                  </label>
                  <input
                    type="number"
                    value={quickAddForm.rate}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${formatCurrency(quickAddForm.quantity * quickAddForm.rate)}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeQuickAdd}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAddSubmit}
                  disabled={!quickAddForm.description}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Panel Sidebar */}
      {selectedItemId && (
        <div className="w-96 flex-shrink-0 h-screen sticky top-0">
          <CalculationPanel
            lineItemId={selectedItemId}
            onClose={() => setSelectedItemId(null)}
            onAddChild={handleChildAdded}
            productionSchedule={production ? {
              prep_weeks: production.prep_weeks || 4,
              shoot_weeks: production.shoot_weeks || 12,
              post_weeks: production.post_weeks || 8,
            } : undefined}
            onScheduleUpdate={(lineItemId, schedule) => {
              // Refresh data when schedule is updated
              loadData();
            }}
          />
        </div>
      )}
    </div>
  );
}
