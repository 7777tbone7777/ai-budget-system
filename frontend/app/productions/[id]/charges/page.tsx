'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ContractualCharge {
  id: string;
  name: string;
  charge_type: 'percentage' | 'flat_fee';
  rate: number;
  applies_to: string | null;
  exclusions: string[] | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

interface ChargeCalculation {
  budget_total: number;
  total_charges: string;
  grand_total: string;
  breakdown: {
    id: string;
    name: string;
    charge_type: string;
    rate: number;
    applies_to: string | null;
    amount: string;
  }[];
}

// Common contractual charges templates
const CHARGE_TEMPLATES = [
  { name: 'Studio Overhead', charge_type: 'percentage', rate: 15, applies_to: 'BTL Total' },
  { name: 'Completion Bond', charge_type: 'percentage', rate: 2.5, applies_to: 'Total Budget' },
  { name: 'Production Fee', charge_type: 'percentage', rate: 5, applies_to: 'Total Budget' },
  { name: 'Insurance', charge_type: 'percentage', rate: 3, applies_to: 'Total Budget' },
  { name: 'Contingency', charge_type: 'percentage', rate: 10, applies_to: 'Total Budget' },
  { name: 'Legal Fees', charge_type: 'flat_fee', rate: 50000, applies_to: null },
  { name: 'Accounting Fees', charge_type: 'flat_fee', rate: 25000, applies_to: null },
];

export default function ContractualChargesPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [charges, setCharges] = useState<ContractualCharge[]>([]);
  const [calculation, setCalculation] = useState<ChargeCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetTotal, setBudgetTotal] = useState<number>(5000000); // Default for demo
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ContractualCharge | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    charge_type: 'percentage' as 'percentage' | 'flat_fee',
    rate: 0,
    applies_to: 'Total Budget',
    active: true,
  });

  const fetchCharges = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/contractual-charges`
      );
      if (!res.ok) throw new Error('Failed to fetch charges');
      const data = await res.json();
      setCharges(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateCharges = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/contractual-charges/calculate?budget_total=${budgetTotal}`
      );
      if (!res.ok) throw new Error('Failed to calculate charges');
      const data = await res.json();
      setCalculation(data);
    } catch (err: any) {
      console.error('Calculation error:', err);
    }
  };

  useEffect(() => {
    fetchCharges();
  }, [productionId]);

  useEffect(() => {
    if (charges.length > 0 && budgetTotal > 0) {
      calculateCharges();
    }
  }, [charges, budgetTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCharge
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/contractual-charges/${editingCharge.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/contractual-charges`;

      const res = await fetch(url, {
        method: editingCharge ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sort_order: charges.length,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save charge');
      }

      setShowAddModal(false);
      setEditingCharge(null);
      setFormData({ name: '', charge_type: 'percentage', rate: 0, applies_to: 'Total Budget', active: true });
      fetchCharges();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this charge?')) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/contractual-charges/${id}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete charge');
      }

      fetchCharges();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (charge: ContractualCharge) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/contractual-charges/${charge.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: !charge.active }),
        }
      );

      if (!res.ok) throw new Error('Failed to update charge');
      fetchCharges();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const applyTemplate = (template: typeof CHARGE_TEMPLATES[0]) => {
    setFormData({
      name: template.name,
      charge_type: template.charge_type as 'percentage' | 'flat_fee',
      rate: template.rate,
      applies_to: template.applies_to || 'Total Budget',
      active: true,
    });
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading charges...</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Contractual Charges</h1>
              <p className="text-sm text-gray-600 mt-1">
                Studio fees, bonds, insurance, and other production charges
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Charge
            </button>
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
        {/* Budget Total Input */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Base for Calculations</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Total (for percentage calculations)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  value={budgetTotal}
                  onChange={(e) => setBudgetTotal(parseFloat(e.target.value) || 0)}
                  className="pl-8 w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={calculateCharges}
              className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Recalculate
            </button>
          </div>
        </div>

        {/* Summary */}
        {calculation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">Budget Total</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(calculation.budget_total)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">Total Charges</div>
              <div className="text-2xl font-bold text-orange-600">
                +{formatCurrency(calculation.total_charges)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">Grand Total</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(calculation.grand_total)}
              </div>
            </div>
          </div>
        )}

        {/* Charges List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Configured Charges ({charges.length})
            </h2>
          </div>

          {charges.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No contractual charges configured yet.</p>
              <p className="mt-2 text-sm">Add common charges like Studio Overhead, Completion Bond, or Contingency.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {charges.map((charge) => {
                const calcItem = calculation?.breakdown.find((b) => b.id === charge.id);
                return (
                  <div
                    key={charge.id}
                    className={`px-6 py-4 flex items-center justify-between ${
                      !charge.active ? 'bg-gray-50 opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleToggleActive(charge)}
                        className={`w-10 h-6 rounded-full relative transition-colors ${
                          charge.active ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            charge.active ? 'right-1' : 'left-1'
                          }`}
                        />
                      </button>
                      <div>
                        <div className="font-medium text-gray-900">{charge.name}</div>
                        <div className="text-sm text-gray-500">
                          {charge.charge_type === 'percentage'
                            ? `${charge.rate}% of ${charge.applies_to || 'Total Budget'}`
                            : `${formatCurrency(charge.rate)} flat fee`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {calcItem && charge.active && (
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(calcItem.amount)}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setEditingCharge(charge);
                          setFormData({
                            name: charge.name,
                            charge_type: charge.charge_type,
                            rate: charge.rate,
                            applies_to: charge.applies_to || 'Total Budget',
                            active: charge.active,
                          });
                          setShowAddModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(charge.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCharge ? 'Edit Charge' : 'Add Contractual Charge'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Quick Templates */}
              {!editingCharge && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Templates
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CHARGE_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charge Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Studio Overhead"
                />
              </div>

              {/* Charge Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charge Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="charge_type"
                      value="percentage"
                      checked={formData.charge_type === 'percentage'}
                      onChange={() => setFormData({ ...formData, charge_type: 'percentage' })}
                      className="mr-2"
                    />
                    Percentage
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="charge_type"
                      value="flat_fee"
                      checked={formData.charge_type === 'flat_fee'}
                      onChange={() => setFormData({ ...formData, charge_type: 'flat_fee' })}
                      className="mr-2"
                    />
                    Flat Fee
                  </label>
                </div>
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.charge_type === 'percentage' ? 'Percentage' : 'Amount'}
                </label>
                <div className="relative">
                  {formData.charge_type === 'flat_fee' && (
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  )}
                  <input
                    type="number"
                    step={formData.charge_type === 'percentage' ? '0.1' : '1'}
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                    required
                    className={`w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${
                      formData.charge_type === 'flat_fee' ? 'pl-8' : ''
                    }`}
                  />
                  {formData.charge_type === 'percentage' && (
                    <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                  )}
                </div>
              </div>

              {/* Applies To (for percentages) */}
              {formData.charge_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Applies To
                  </label>
                  <select
                    value={formData.applies_to}
                    onChange={(e) => setFormData({ ...formData, applies_to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Total Budget">Total Budget</option>
                    <option value="BTL Total">Below-the-Line Total</option>
                    <option value="ATL Total">Above-the-Line Total</option>
                    <option value="Production Total">Production Total</option>
                    <option value="Post Production Total">Post Production Total</option>
                  </select>
                </div>
              )}

              {/* Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Active (include in calculations)
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCharge(null);
                    setFormData({ name: '', charge_type: 'percentage', rate: 0, applies_to: 'Total Budget', active: true });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingCharge ? 'Update' : 'Add'} Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
