'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import MultiPeriodForm from './MultiPeriodForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app';

interface LineItem {
  id: string;
  account_code: string;
  description: string;
  position_title?: string;
  union_local?: string;
  department?: string;
  atl_or_btl?: string;
  quantity: number;
  rate: number;
  subtotal: number;
  fringes: number;
  total: number;
  notes?: string;
}

interface Production {
  id: string;
  name: string;
  production_type: string;
  distribution_platform?: string;
  shooting_location?: string;
  state?: string;
  budget_target?: number;
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

  useEffect(() => {
    loadData();
  }, [productionId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load production details, line items, and rate cards in parallel
      const [prodRes, lineItemsRes, rateCardsRes] = await Promise.all([
        axios.get(`${API_URL}/api/productions/${productionId}`),
        axios.get(`${API_URL}/api/productions/${productionId}/line-items`),
        axios.get(`${API_URL}/api/rate-cards`)
      ]);

      setProduction(prodRes.data.data);
      setLineItems(lineItemsRes.data.data || []);
      setRateCards(rateCardsRes.data.data || []);

      // Calculate totals
      calculateTotals(lineItemsRes.data.data || []);
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
      const total = parseFloat(item.total?.toString() || '0');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading budget...</div>
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
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
            {production.budget_target && <span>• Target: ${production.budget_target.toLocaleString()}</span>}
          </div>
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-sm text-blue-600 font-medium">Above the Line</div>
            <div className="text-3xl font-bold text-blue-900">${totals.atl.toLocaleString()}</div>
            <div className="text-sm text-blue-700 mt-1">{groupedItems.atl.length} items</div>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <div className="text-sm text-green-600 font-medium">Below the Line</div>
            <div className="text-3xl font-bold text-green-900">${totals.btl.toLocaleString()}</div>
            <div className="text-sm text-green-700 mt-1">{groupedItems.btl.length} items</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="text-sm text-purple-600 font-medium">Other</div>
            <div className="text-3xl font-bold text-purple-900">${totals.other.toLocaleString()}</div>
            <div className="text-sm text-purple-700 mt-1">{groupedItems.other.length} items</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-6">
            <div className="text-sm text-orange-600 font-medium">Grand Total</div>
            <div className="text-3xl font-bold text-orange-900">${totals.grand_total.toLocaleString()}</div>
            <div className="text-sm text-orange-700 mt-1">{lineItems.length} total items</div>
          </div>
        </div>

        {/* Add Line Item Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {showAddForm ? 'Cancel' : '+ Add Line Item'}
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
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate_override}
                  onChange={(e) => setFormData({...formData, rate_override: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Leave blank for automatic lookup"
                />
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fringes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedItems.atl.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.account_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.union_local || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${item.rate?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${item.subtotal?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">${item.fringes?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${item.total?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteLineItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right text-xl font-bold text-gray-900">
              ATL Subtotal: ${totals.atl.toLocaleString()}
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fringes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedItems.btl.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.account_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.department || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.union_local || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${item.rate?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${item.subtotal?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">${item.fringes?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${item.total?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteLineItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right text-xl font-bold text-gray-900">
              BTL Subtotal: ${totals.btl.toLocaleString()}
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedItems.other.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.account_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${item.rate?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${item.total?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteLineItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {lineItems.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Budget Line Items Yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first budget line item above
            </p>
          </div>
        )}

        {/* Grand Total */}
        {lineItems.length > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg p-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-medium opacity-90">Production Budget Total</div>
                <div className="text-5xl font-bold mt-2">${totals.grand_total.toLocaleString()}</div>
                {production.budget_target && (
                  <div className="text-sm mt-2 opacity-90">
                    Target: ${production.budget_target.toLocaleString()}
                    {' '}
                    ({((totals.grand_total / production.budget_target) * 100).toFixed(1)}% of target)
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">ATL: ${totals.atl.toLocaleString()}</div>
                <div className="text-sm opacity-90">BTL: ${totals.btl.toLocaleString()}</div>
                <div className="text-sm opacity-90">Other: ${totals.other.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
