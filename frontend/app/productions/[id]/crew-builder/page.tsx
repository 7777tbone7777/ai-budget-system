'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app';

interface Position {
  position: string;
  union: string;
  quantity: number;
  originalQuantity: number;
  weeks: number;
  originalWeeks: number;
  weeklyRate: number;
  rateType: string;
  baseCost: number;
  fringes: number;
  total: number;
  essential: boolean;
  source: string;
}

interface Department {
  name: string;
  templateName: string;
  positions: Position[];
  subtotal: number;
  priority: number;
}

interface Recommendations {
  productionType: string;
  productionTypeName: string;
  budget: number;
  shootDays: number;
  location: string;
  departments: Department[];
  summary: {
    totalPositions: number;
    totalCrew: number;
    estimatedLaborCost: number;
    estimatedFringes: number;
    estimatedTotal: number;
    budgetPercentage: string;
  };
  optimizations: Array<{
    type: string;
    message: string;
    potentialSavings: number | null;
    department?: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
  }>;
}

export default function CrewBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [productionType, setProductionType] = useState('theatrical');
  const [budget, setBudget] = useState(10000000);
  const [shootDays, setShootDays] = useState(30);
  const [location, setLocation] = useState('Los Angeles');
  const [prompt, setPrompt] = useState('');

  // Selected departments for applying
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());

  const productionTypes = [
    { value: 'theatrical', label: 'Theatrical Feature' },
    { value: 'hbsvod', label: 'High Budget SVOD (Streaming)' },
    { value: 'television', label: 'TV Series' },
    { value: 'multi_cam', label: 'Multi-Camera Sitcom' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'indie', label: 'Independent Film' },
  ];

  const locations = [
    'Los Angeles', 'Atlanta', 'New York', 'Vancouver', 'Toronto',
    'New Orleans', 'Chicago', 'Boston', 'Portland', 'Santa Fe'
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/ai/crew/recommend`, {
        prompt: prompt || undefined,
        productionType,
        budget,
        shootDays,
        location,
      });

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
        // Select all departments by default
        const deptNames = new Set<string>(response.data.recommendations.departments.map((d: Department) => d.name));
        setSelectedDepts(deptNames);
      } else {
        setError(response.data.error || 'Failed to generate recommendations');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const applyToProduction = async () => {
    if (!recommendations) return;

    setApplying(true);
    setError(null);

    try {
      const selectedDepartments = recommendations.departments.filter(d => selectedDepts.has(d.name));

      const response = await axios.post(`${API_URL}/api/ai/crew/apply/${productionId}`, {
        departments: selectedDepartments,
        applyFringes: true,
      });

      if (response.data.success) {
        router.push(`/productions/${productionId}/budget`);
      } else {
        setError(response.data.error || 'Failed to apply crew');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to apply crew');
    } finally {
      setApplying(false);
    }
  };

  const toggleDepartment = (deptName: string) => {
    const newSelected = new Set(selectedDepts);
    if (newSelected.has(deptName)) {
      newSelected.delete(deptName);
    } else {
      newSelected.add(deptName);
    }
    setSelectedDepts(newSelected);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/productions" className="hover:text-blue-600">Productions</Link>
            <span>/</span>
            <Link href={`/productions/${productionId}`} className="hover:text-blue-600">Production</Link>
            <span>/</span>
            <span className="text-gray-900">Smart Crew Builder</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Crew Builder</h1>
          <p className="mt-2 text-gray-600">
            AI-powered crew recommendations based on your production parameters
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Production Parameters</h2>

              {/* Natural Language Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe Your Production (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., $15M streaming feature shooting 40 days in Atlanta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>

              <div className="border-t pt-4 mb-4">
                <p className="text-xs text-gray-500 mb-3">Or configure manually:</p>
              </div>

              {/* Production Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Production Type
                </label>
                <select
                  value={productionType}
                  onChange={(e) => setProductionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {productionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Budget
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                    min={100000}
                    step={100000}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{formatCurrency(budget)}</p>
              </div>

              {/* Shoot Days */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shoot Days
                </label>
                <input
                  type="number"
                  value={shootDays}
                  onChange={(e) => setShootDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min={1}
                  max={200}
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateRecommendations}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate Crew Recommendations'
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {!recommendations && !loading && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Crew Recommendations Yet</h3>
                <p className="text-gray-500">Configure your production parameters and click "Generate" to get AI-powered crew recommendations.</p>
              </div>
            )}

            {recommendations && (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {recommendations.productionTypeName} Crew
                      </h2>
                      <p className="text-gray-500">
                        {recommendations.shootDays} shoot days in {recommendations.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(recommendations.summary.estimatedTotal)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {recommendations.summary.budgetPercentage}% of budget
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Positions</p>
                      <p className="text-lg font-semibold">{recommendations.summary.totalPositions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Crew</p>
                      <p className="text-lg font-semibold">{recommendations.summary.totalCrew}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Labor Cost</p>
                      <p className="text-lg font-semibold">{formatCurrency(recommendations.summary.estimatedLaborCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fringes</p>
                      <p className="text-lg font-semibold">{formatCurrency(recommendations.summary.estimatedFringes)}</p>
                    </div>
                  </div>
                </div>

                {/* Warnings & Optimizations */}
                {(recommendations.warnings.length > 0 || recommendations.optimizations.length > 0) && (
                  <div className="space-y-3">
                    {recommendations.warnings.map((warning, idx) => (
                      <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                        <span className="text-yellow-500 mt-0.5">&#x26A0;</span>
                        <p className="text-yellow-800 text-sm">{warning.message}</p>
                      </div>
                    ))}
                    {recommendations.optimizations.map((opt, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <span className="text-blue-500 mt-0.5">&#x1F4A1;</span>
                        <div>
                          <p className="text-blue-800 text-sm">{opt.message}</p>
                          {opt.potentialSavings && (
                            <p className="text-blue-600 text-xs mt-1">
                              Potential savings: {formatCurrency(opt.potentialSavings)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Department Cards */}
                {recommendations.departments.map((dept) => (
                  <div key={dept.name} className="bg-white rounded-lg shadow overflow-hidden">
                    <div
                      className={`px-6 py-4 flex justify-between items-center cursor-pointer ${
                        selectedDepts.has(dept.name) ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                      onClick={() => toggleDepartment(dept.name)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDepts.has(dept.name)}
                          onChange={() => toggleDepartment(dept.name)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                          <p className="text-sm text-gray-500">{dept.positions.length} positions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(dept.subtotal)}</p>
                      </div>
                    </div>

                    <div className="px-6 py-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b">
                            <th className="pb-2">Position</th>
                            <th className="pb-2">Union</th>
                            <th className="pb-2 text-center">Qty</th>
                            <th className="pb-2 text-center">Weeks</th>
                            <th className="pb-2 text-right">Rate</th>
                            <th className="pb-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dept.positions.map((pos, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2">
                                <span className="flex items-center gap-2">
                                  {pos.position}
                                  {pos.essential && (
                                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                      Essential
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="py-2 text-gray-500">{pos.union}</td>
                              <td className="py-2 text-center">{pos.quantity}</td>
                              <td className="py-2 text-center">{pos.weeks}</td>
                              <td className="py-2 text-right">{formatCurrency(pos.weeklyRate)}/wk</td>
                              <td className="py-2 text-right font-medium">{formatCurrency(pos.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Apply Button */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">
                        {selectedDepts.size} of {recommendations.departments.length} departments selected
                      </p>
                      <p className="font-semibold text-gray-900">
                        Selected Total: {formatCurrency(
                          recommendations.departments
                            .filter(d => selectedDepts.has(d.name))
                            .reduce((sum, d) => sum + d.subtotal, 0)
                        )}
                      </p>
                    </div>
                    <button
                      onClick={applyToProduction}
                      disabled={applying || selectedDepts.size === 0}
                      className="bg-green-600 text-white py-2 px-6 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applying ? 'Applying...' : 'Apply to Budget'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
