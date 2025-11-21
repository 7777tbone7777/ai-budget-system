'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app';

interface LocationData {
  location: string;
  avg_total: number;
  avg_atl: number;
  avg_btl: number;
  atl_percentage: number;
  btl_percentage: number;
  count: number;
}

interface ComparisonResult {
  location: string;
  avg_total: number;
  avg_atl: number;
  avg_btl: number;
  atl_percentage: number;
  budget_count: number;
}

export default function LocationComparisonPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [budgetSize, setBudgetSize] = useState<number>(6000000);
  const [comparison, setComparison] = useState<ComparisonResult[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [savings, setSavings] = useState({ amount: 0, percent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/location-comparison`);
      setLocations(response.data.locations);
      setLoading(false);
    } catch (error) {
      console.error('Error loading locations:', error);
      setLoading(false);
    }
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const compareLocations = async () => {
    if (selectedLocations.length === 0) {
      alert('Please select at least one location');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/location-comparison/compare`, {
        locations: selectedLocations,
        budget_size: budgetSize
      });

      setComparison(response.data.comparison);
      setRecommendation(response.data.recommendation);
      setSavings(response.data.savings);
    } catch (error) {
      console.error('Error comparing locations:', error);
      alert('Failed to compare locations');
    }
  };

  const selectAllLocations = () => {
    setSelectedLocations(locations.map(l => l.location));
  };

  const clearSelections = () => {
    setSelectedLocations([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading location data...</div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Location Comparison Tool
          </h1>
          <p className="text-gray-600">
            Compare production costs across 10 filming locations based on 33 real budgets
          </p>
        </div>

        {/* Budget Size Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Production Budget</h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Size (USD)
            </label>
            <input
              type="number"
              value={budgetSize}
              onChange={(e) => setBudgetSize(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-lg"
              step="100000"
            />
            <p className="text-sm text-gray-500 mt-2">
              ${(budgetSize / 1000000).toFixed(2)}M total budget
            </p>
          </div>
        </div>

        {/* All Locations Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All Locations ({locations.length} Available)
          </h2>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ATL %</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">BTL %</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budgets</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Select</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((loc, index) => (
                  <tr
                    key={loc.location}
                    className={`${index === 0 ? 'bg-green-50' : ''} ${selectedLocations.includes(loc.location) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`${index === 0 ? 'text-green-600 font-bold text-lg' : 'text-gray-900'}`}>
                        {index + 1}
                      </span>
                      {index === 0 && <span className="ml-2">🏆</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {loc.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                      ${(loc.avg_total / 1000000).toFixed(2)}M
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                      {loc.atl_percentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                      {loc.btl_percentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
                      {loc.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(loc.location)}
                        onChange={() => toggleLocation(loc.location)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={selectAllLocations}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Select All
            </button>
            <button
              onClick={clearSelections}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear
            </button>
            <button
              onClick={compareLocations}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
              disabled={selectedLocations.length === 0}
            >
              Compare Selected ({selectedLocations.length})
            </button>
            <span className="text-sm text-gray-500">
              {selectedLocations.length > 0 ? `Selected: ${selectedLocations.join(', ')}` : 'No locations selected'}
            </span>
          </div>
        </div>

        {/* Comparison Results */}
        {comparison.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Comparison Results
            </h2>

            {/* Recommendation */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex items-start">
                <span className="text-2xl mr-3">💡</span>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">Recommendation</h3>
                  <p className="text-blue-800">{recommendation}</p>
                </div>
              </div>
            </div>

            {/* Savings Highlight */}
            {savings.amount > 0 && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">💰</span>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-1">Potential Savings</h3>
                    <p className="text-green-800">
                      Save <span className="font-bold">${(savings.amount / 1000000).toFixed(2)}M</span> ({savings.percent.toFixed(1)}%) by choosing the most cost-effective location
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ATL</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">BTL</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ATL %</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Difference</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparison.map((loc, index) => {
                    const cheapest = comparison[0];
                    const diff = loc.avg_total - cheapest.avg_total;
                    const diffPercent = cheapest.avg_total > 0 ? (diff / cheapest.avg_total) * 100 : 0;

                    return (
                      <tr key={loc.location} className={index === 0 ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={index === 0 ? 'text-green-600 font-bold text-lg' : 'text-gray-900'}>
                            {index + 1}
                          </span>
                          {index === 0 && <span className="ml-2">🏆</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {loc.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                          ${(loc.avg_total / 1000000).toFixed(2)}M
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                          ${(loc.avg_atl / 1000000).toFixed(2)}M
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                          ${(loc.avg_btl / 1000000).toFixed(2)}M
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                          {loc.atl_percentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {index === 0 ? (
                            <span className="text-green-600 font-semibold">Baseline</span>
                          ) : (
                            <span className="text-red-600">
                              +${(diff / 1000000).toFixed(2)}M (+{diffPercent.toFixed(1)}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Data based on 33 real production budgets from 2021</p>
          <p>Analysis includes budgets from $1.8M to $7.5M</p>
        </div>
      </div>
    </div>
  );
}
