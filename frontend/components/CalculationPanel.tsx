'use client';

import { useState, useEffect } from 'react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  subtotal: number;
  fringes: number;
  total: number;
  is_parent?: boolean;
  children?: LineItem[];
}

interface CalculationStep {
  label: string;
  value: number;
  operation: 'base' | 'multiply' | 'add' | 'result' | 'percentage';
}

interface Breakdown {
  type: 'simple' | 'complex';
  steps: CalculationStep[];
  fringes?: { rate: number; amount: number };
  total: number;
}

interface CalculationPanelProps {
  lineItemId: string | null;
  onClose: () => void;
  onAddChild?: (parentId: string, child: Partial<LineItem>) => void;
  onUpdate?: (item: LineItem) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CalculationPanel({ lineItemId, onClose, onAddChild, onUpdate }: CalculationPanelProps) {
  const [item, setItem] = useState<LineItem | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [children, setChildren] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState({ description: '', quantity: 1, rate: 0 });

  useEffect(() => {
    if (lineItemId) {
      fetchCalculation();
    }
  }, [lineItemId]);

  const fetchCalculation = async () => {
    if (!lineItemId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/line-items/${lineItemId}/calculation`);
      const data = await response.json();
      if (data.success) {
        setItem(data.item);
        setBreakdown(data.breakdown);
        if (data.childrenSummary) {
          setChildren(data.childrenSummary);
        }
      }
    } catch (err) {
      console.error('Failed to fetch calculation:', err);
    }
    setLoading(false);
  };

  const handleAddChild = async () => {
    if (!lineItemId || !newChild.description) return;

    try {
      const response = await fetch(`${API_URL}/api/line-items/${lineItemId}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChild)
      });
      const data = await response.json();
      if (data.success) {
        setChildren(prev => [...prev, data.item]);
        setNewChild({ description: '', quantity: 1, rate: 0 });
        setShowAddChild(false);
        fetchCalculation(); // Refresh to get updated parent totals
        if (onAddChild) onAddChild(lineItemId, data.item);
      }
    } catch (err) {
      console.error('Failed to add child:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (!lineItemId) {
    return (
      <div className="bg-gray-50 border-l h-full p-6 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">&#128270;</div>
          <p>Select a line item to view calculation details</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border-l h-full p-6 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border-l h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Calculation Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            &#10005;
          </button>
        </div>
        {item && (
          <p className="text-sm text-gray-600 mt-1 truncate">{item.description}</p>
        )}
      </div>

      {item && (
        <div className="p-4 space-y-6">
          {/* Total Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(item.total)}</p>
            </div>
          </div>

          {/* Calculation Steps */}
          {breakdown && (
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Calculation Breakdown</h3>
              <div className="space-y-2">
                {breakdown.steps.map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded ${
                      step.operation === 'result' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {step.operation === 'multiply' && <span className="text-gray-400">&#215;</span>}
                      {step.operation === 'add' && <span className="text-gray-400">+</span>}
                      {step.operation === 'percentage' && <span className="text-gray-400">%</span>}
                      <span className={step.operation === 'result' ? 'font-medium' : ''}>{step.label}</span>
                    </div>
                    <span className={step.operation === 'result' ? 'font-bold text-blue-700' : 'font-medium'}>
                      {formatCurrency(step.value)}
                    </span>
                  </div>
                ))}

                {breakdown.fringes && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-100">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">+</span>
                      <span>Fringes ({(breakdown.fringes.rate * 100).toFixed(1)}%)</span>
                    </div>
                    <span className="font-medium text-green-700">
                      {formatCurrency(breakdown.fringes.amount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded border border-indigo-100 mt-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-indigo-700">{formatCurrency(item.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Children / Sub-items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">
                Sub-Items {children.length > 0 && `(${children.length})`}
              </h3>
              <button
                onClick={() => setShowAddChild(!showAddChild)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Sub-Item
              </button>
            </div>

            {/* Add Child Form */}
            {showAddChild && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-3">
                <input
                  type="text"
                  value={newChild.description}
                  onChange={(e) => setNewChild(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Qty</label>
                    <input
                      type="number"
                      value={newChild.quantity}
                      onChange={(e) => setNewChild(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Rate</label>
                    <input
                      type="number"
                      value={newChild.rate}
                      onChange={(e) => setNewChild(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Subtotal: {formatCurrency(newChild.quantity * newChild.rate)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddChild(false)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddChild}
                      disabled={!newChild.description}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Children List */}
            {children.length > 0 ? (
              <div className="space-y-2">
                {children.map((child, i) => (
                  <div key={i} className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{child.description}</span>
                      <span className="font-medium">{formatCurrency(child.total || child.subtotal)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {child.quantity} &#215; {formatCurrency(child.rate)}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Sub-Items Total</span>
                  <span className="font-bold">
                    {formatCurrency(children.reduce((sum, c) => sum + (c.total || c.subtotal), 0))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm">
                No sub-items. Click "Add Sub-Item" to break down this line item.
              </div>
            )}
          </div>

          {/* Quick Calculation Templates */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Quick Calculators</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 border rounded-lg text-sm text-left hover:bg-gray-50 transition">
                <div className="font-medium">Overtime</div>
                <div className="text-xs text-gray-500">1.5x / 2x rates</div>
              </button>
              <button className="p-3 border rounded-lg text-sm text-left hover:bg-gray-50 transition">
                <div className="font-medium">Per Diem</div>
                <div className="text-xs text-gray-500">Travel + meals</div>
              </button>
              <button className="p-3 border rounded-lg text-sm text-left hover:bg-gray-50 transition">
                <div className="font-medium">Equipment</div>
                <div className="text-xs text-gray-500">Day/week rates</div>
              </button>
              <button className="p-3 border rounded-lg text-sm text-left hover:bg-gray-50 transition">
                <div className="font-medium">Kit Rental</div>
                <div className="text-xs text-gray-500">Box + allowances</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
