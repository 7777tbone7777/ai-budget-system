'use client';

import { useState, useEffect } from 'react';

interface TaxIncentive {
  id: string;
  state: string;
  incentive_min_percent: string;
  incentive_max_percent: string;
  incentive_type: string;
  incentive_mechanism: string;
  minimum_spend?: string;
  annual_cap?: string;
}

interface ComparisonResult {
  state: string;
  eligible: boolean;
  totalCredit?: number;
  effectiveRate?: string;
  incentiveType?: string;
  mechanism?: string;
  reason?: string;
}

export default function TaxIncentivesPage() {
  const API_URL = 'https://backend-production-8e04.up.railway.app/api';

  const [states, setStates] = useState<TaxIncentive[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [budget, setBudget] = useState({
    totalBudget: 10000000,
    residentAtlSpend: 1000000,
    residentBtlSpend: 2000000,
    nonResidentAtlSpend: 500000,
    nonResidentBtlSpend: 1500000,
    qualifiedSpend: 6000000,
  });

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const response = await fetch(`${API_URL}/tax-incentives`);
      const data = await response.json();
      if (data.success) {
        setStates(data.data.sort((a: TaxIncentive, b: TaxIncentive) =>
          a.state.localeCompare(b.state)
        ));
      }
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const compareStates = async () => {
    if (selectedStates.length === 0) {
      alert('Please select at least one state');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tax-incentives/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          states: selectedStates,
          ...budget,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setComparison(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error comparing states:', error);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          U.S. Film Tax Incentive Calculator
        </h1>
        <p className="text-gray-600 mb-8">
          Compare production tax incentives across {states.length} U.S. states
        </p>

        {/* Budget Inputs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Production Budget Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(budget).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ($)
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setBudget({...budget, [key]: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* State Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Select States to Compare
          </h2>
          <div className="mb-4 space-x-2">
            <button
              onClick={() => setSelectedStates(states.map(s => s.state))}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedStates([])}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear All
            </button>
            <button
              onClick={compareStates}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Compare Selected States
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {states.map((state) => (
              <label key={state.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedStates.includes(state.state)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStates([...selectedStates, state.state]);
                    } else {
                      setSelectedStates(selectedStates.filter(s => s !== state.state));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm">{state.state}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Results */}
        {comparison.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Comparison Results
            </h2>

            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Credit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparison.map((result, index) => (
                    <tr key={index} className={index === 0 ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={index === 0 ? 'text-green-600 font-bold text-lg' : 'text-gray-900'}>
                          {index + 1}
                        </span>
                        {index === 0 && <span className="ml-2 text-xl">🏆</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {result.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {result.eligible ? `$${result.totalCredit?.toLocaleString()}` : 'Not Eligible'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {result.eligible ? `${result.effectiveRate}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {result.incentiveType} {result.mechanism}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.eligible ? (
                          <span className="text-green-600">✓ Eligible</span>
                        ) : (
                          <span className="text-red-600">{result.reason}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">States Compared</div>
                  <div className="text-2xl font-bold text-blue-900">{summary.totalStatesCompared}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Eligible States</div>
                  <div className="text-2xl font-bold text-green-900">{summary.eligibleStates}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Best State</div>
                  <div className="text-2xl font-bold text-purple-900">{summary.bestState || 'None'}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">Best Credit</div>
                  <div className="text-2xl font-bold text-orange-900">
                    ${summary.bestCredit?.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
