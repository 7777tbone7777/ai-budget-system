'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Baseline {
  totalBudget: number;
  productionType: string;
  shootDays: number;
  locations: number;
  crewSize: number;
  principalCast: number;
  stuntDays: number;
  vfxShots: number;
  contingency: number;
}

interface Scenario {
  name: string;
  changes: Record<string, number>;
}

interface Impact {
  changeType: string;
  changeValue: number;
  description: string;
  dollarImpact: number;
  percentImpact: number;
  affectedCategories: string[];
  category?: string;
}

interface Risk {
  level: 'high' | 'medium' | 'low' | 'info';
  category: string;
  description: string;
  mitigation: string;
}

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  potentialSavings: number;
}

interface Analysis {
  scenarioName: string;
  baseline: Baseline;
  impacts: Impact[];
  cascadeEffects: Impact[];
  totalImpact: number;
  newTotal: number;
  percentChange: number;
  riskFactors: Risk[];
  recommendations: Recommendation[];
}

interface Prediction {
  expectedVariance: number;
  varianceRange: {
    optimistic: number;
    expected: number;
    pessimistic: number;
  };
  confidenceLevel: number;
  factors: { factor: string; impact: string; description: string }[];
  recommendations: { title: string; value: string; description: string }[];
}

const PRODUCTION_TYPES = [
  { value: 'theatrical', label: 'Theatrical Feature' },
  { value: 'hbsvod', label: 'High Budget SVOD' },
  { value: 'television', label: 'TV Series' },
  { value: 'indie', label: 'Independent Film' },
  { value: 'commercial', label: 'Commercial' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function WhatIfAnalyzer() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  // Baseline state
  const [baseline, setBaseline] = useState<Baseline>({
    totalBudget: 15000000,
    productionType: 'theatrical',
    shootDays: 30,
    locations: 5,
    crewSize: 50,
    principalCast: 5,
    stuntDays: 0,
    vfxShots: 0,
    contingency: 0.10,
  });

  // Scenarios state
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario>({
    name: 'New Scenario',
    changes: {},
  });

  // Natural language input
  const [nlPrompt, setNlPrompt] = useState('');

  // Results
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [summary, setSummary] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'single' | 'compare' | 'predict'>('single');

  // Fetch production data on mount
  useEffect(() => {
    if (productionId && productionId !== 'new') {
      fetchProductionBaseline();
    }
  }, [productionId]);

  const fetchProductionBaseline = async () => {
    try {
      const response = await fetch(`${API_URL}/api/productions/${productionId}`);
      const data = await response.json();
      if (data) {
        setBaseline(prev => ({
          ...prev,
          totalBudget: data.budget || prev.totalBudget,
          productionType: data.production_type || prev.productionType,
          shootDays: data.shoot_days || prev.shootDays,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch production:', err);
    }
  };

  const handleBaselineChange = (field: keyof Baseline, value: number | string) => {
    setBaseline(prev => ({ ...prev, [field]: value }));
  };

  const handleScenarioChange = (field: string, value: number) => {
    setCurrentScenario(prev => ({
      ...prev,
      changes: { ...prev.changes, [field]: value },
    }));
  };

  const removeScenarioChange = (field: string) => {
    setCurrentScenario(prev => {
      const newChanges = { ...prev.changes };
      delete newChanges[field];
      return { ...prev, changes: newChanges };
    });
  };

  const parseNaturalLanguage = async () => {
    if (!nlPrompt.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/ai/whatif/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: nlPrompt }),
      });
      const data = await response.json();
      if (data.success) {
        setCurrentScenario(data.scenario);
        setNlPrompt('');
      }
    } catch (err) {
      console.error('Failed to parse:', err);
    }
  };

  const analyzeScenario = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/ai/whatif/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseline, scenario: currentScenario }),
      });
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
        setSummary(data.summary);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const predictVariance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/ai/whatif/predict-variance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseline }),
      });
      const data = await response.json();
      if (data.success) {
        setPrediction(data.prediction);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const addScenarioToComparison = () => {
    if (currentScenario.changes && Object.keys(currentScenario.changes).length > 0) {
      setScenarios(prev => [...prev, { ...currentScenario, name: currentScenario.name || `Scenario ${prev.length + 1}` }]);
      setCurrentScenario({ name: `Scenario ${scenarios.length + 2}`, changes: {} });
    }
  };

  const compareAllScenarios = async () => {
    if (scenarios.length < 2) {
      setError('Add at least 2 scenarios to compare');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/ai/whatif/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseline, scenarios }),
      });
      const data = await response.json();
      if (data.success) {
        setComparison(data.comparison);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/productions/${productionId}`} className="text-blue-600 hover:text-blue-800 text-sm">
                Back to Production
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">What-If Analyzer</h1>
              <p className="text-gray-500 text-sm">Model budget scenarios and predict variance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-4">
            {/* Baseline Configuration */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Baseline Budget</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Total Budget</label>
                  <input
                    type="number"
                    value={baseline.totalBudget}
                    onChange={(e) => handleBaselineChange('totalBudget', parseFloat(e.target.value))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Production Type</label>
                  <select
                    value={baseline.productionType}
                    onChange={(e) => handleBaselineChange('productionType', e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {PRODUCTION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Shoot Days</label>
                    <input
                      type="number"
                      value={baseline.shootDays}
                      onChange={(e) => handleBaselineChange('shootDays', parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Locations</label>
                    <input
                      type="number"
                      value={baseline.locations}
                      onChange={(e) => handleBaselineChange('locations', parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Crew Size</label>
                    <input
                      type="number"
                      value={baseline.crewSize}
                      onChange={(e) => handleBaselineChange('crewSize', parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Principal Cast</label>
                    <input
                      type="number"
                      value={baseline.principalCast}
                      onChange={(e) => handleBaselineChange('principalCast', parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Stunt Days</label>
                    <input
                      type="number"
                      value={baseline.stuntDays}
                      onChange={(e) => handleBaselineChange('stuntDays', parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">VFX Shots</label>
                    <input
                      type="number"
                      value={baseline.vfxShots}
                      onChange={(e) => handleBaselineChange('vfxShots', parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contingency (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={baseline.contingency * 100}
                    onChange={(e) => handleBaselineChange('contingency', parseFloat(e.target.value) / 100)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Scenario Builder */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Build Scenario</h2>

              {/* Natural Language Input */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Describe your scenario</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nlPrompt}
                    onChange={(e) => setNlPrompt(e.target.value)}
                    placeholder="e.g., Add 5 more shoot days"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && parseNaturalLanguage()}
                  />
                  <button
                    onClick={parseNaturalLanguage}
                    className="px-3 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200"
                  >
                    Parse
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Scenario Name</label>
                <input
                  type="text"
                  value={currentScenario.name}
                  onChange={(e) => setCurrentScenario(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* Quick Change Buttons */}
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">Quick Changes:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleScenarioChange('shootDays', baseline.shootDays + 5)}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                  >
                    +5 Days
                  </button>
                  <button
                    onClick={() => handleScenarioChange('shootDays', baseline.shootDays - 5)}
                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100"
                  >
                    -5 Days
                  </button>
                  <button
                    onClick={() => handleScenarioChange('crewSize', baseline.crewSize + 10)}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                  >
                    +10 Crew
                  </button>
                  <button
                    onClick={() => handleScenarioChange('locations', baseline.locations + 3)}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                  >
                    +3 Locations
                  </button>
                  <button
                    onClick={() => handleScenarioChange('vfxShots', 50)}
                    className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs hover:bg-purple-100"
                  >
                    +50 VFX
                  </button>
                  <button
                    onClick={() => handleScenarioChange('overtime', 2)}
                    className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs hover:bg-orange-100"
                  >
                    +2hr OT/day
                  </button>
                </div>
              </div>

              {/* Active Changes */}
              {Object.keys(currentScenario.changes).length > 0 && (
                <div className="bg-gray-50 rounded p-3 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Active Changes:</p>
                  {Object.entries(currentScenario.changes).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-600">{key}: {value}</span>
                      <button
                        onClick={() => removeScenarioChange(key)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={analyzeScenario}
                  disabled={loading || Object.keys(currentScenario.changes).length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
                <button
                  onClick={addScenarioToComparison}
                  disabled={Object.keys(currentScenario.changes).length === 0}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Add to Compare
                </button>
              </div>
            </div>

            {/* Variance Prediction */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Variance Prediction</h2>
              <p className="text-sm text-gray-600 mb-3">
                Predict likely budget variance based on historical data for {PRODUCTION_TYPES.find(t => t.value === baseline.productionType)?.label} productions.
              </p>
              <button
                onClick={predictVariance}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Predicting...' : 'Predict Variance'}
              </button>
            </div>

            {/* Scenarios for Comparison */}
            {scenarios.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Scenarios to Compare ({scenarios.length})</h2>
                <div className="space-y-2 mb-4">
                  {scenarios.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <span className="text-sm">{s.name}</span>
                      <button
                        onClick={() => setScenarios(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={compareAllScenarios}
                  disabled={loading || scenarios.length < 2}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Compare All Scenarios
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{analysis.scenarioName}</h2>
                  <div className={`text-2xl font-bold ${analysis.totalImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(analysis.totalImpact)}
                    <span className="text-sm ml-2">({formatPercent(analysis.percentChange)})</span>
                  </div>
                </div>

                {/* Budget Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded p-4 text-center">
                    <p className="text-sm text-gray-500">Baseline</p>
                    <p className="text-xl font-bold">{formatCurrency(baseline.totalBudget)}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-4 text-center">
                    <p className="text-sm text-gray-500">Impact</p>
                    <p className={`text-xl font-bold ${analysis.totalImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {analysis.totalImpact >= 0 ? '+' : ''}{formatCurrency(analysis.totalImpact)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded p-4 text-center">
                    <p className="text-sm text-gray-500">New Total</p>
                    <p className="text-xl font-bold">{formatCurrency(analysis.newTotal)}</p>
                  </div>
                </div>

                {/* Impacts */}
                {analysis.impacts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Direct Impacts</h3>
                    <div className="space-y-2">
                      {analysis.impacts.map((impact, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3">
                          <div>
                            <p className="font-medium">{impact.description}</p>
                            <p className="text-sm text-gray-500">
                              Affects: {impact.affectedCategories.join(', ')}
                            </p>
                          </div>
                          <div className={`text-right ${impact.dollarImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            <p className="font-bold">{formatCurrency(impact.dollarImpact)}</p>
                            <p className="text-sm">{formatPercent(impact.percentImpact)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cascade Effects */}
                {analysis.cascadeEffects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Cascade Effects</h3>
                    <div className="space-y-2">
                      {analysis.cascadeEffects.map((effect, i) => (
                        <div key={i} className="flex items-center justify-between bg-yellow-50 rounded p-3">
                          <p className="text-sm">{effect.description} ({effect.category})</p>
                          <p className={`font-medium ${effect.dollarImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(effect.dollarImpact)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                {analysis.riskFactors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Risk Assessment</h3>
                    <div className="space-y-2">
                      {analysis.riskFactors.map((risk, i) => (
                        <div key={i} className={`rounded p-3 border ${getRiskColor(risk.level)}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-medium uppercase">{risk.level}</span>
                              <p className="font-medium">{risk.description}</p>
                            </div>
                          </div>
                          <p className="text-sm mt-1 opacity-75">Mitigation: {risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
                    <div className="space-y-2">
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} className="bg-blue-50 rounded p-3 border border-blue-100">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-blue-900">{rec.title}</p>
                              <p className="text-sm text-blue-700">{rec.description}</p>
                            </div>
                            {rec.potentialSavings > 0 && (
                              <p className="text-green-600 font-medium whitespace-nowrap ml-4">
                                Save {formatCurrency(rec.potentialSavings)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Variance Prediction Results */}
            {prediction && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Variance Prediction</h2>

                {/* Variance Range */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Expected Budget Range</h3>
                  <div className="relative h-16 bg-gradient-to-r from-green-100 via-yellow-100 to-red-100 rounded-lg">
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Optimistic</p>
                        <p className="font-bold text-green-700">{formatCurrency(prediction.varianceRange.optimistic)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Expected</p>
                        <p className="font-bold text-yellow-700">{formatCurrency(prediction.varianceRange.expected)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Pessimistic</p>
                        <p className="font-bold text-red-700">{formatCurrency(prediction.varianceRange.pessimistic)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Confidence: {(prediction.confidenceLevel * 100).toFixed(0)}%
                  </p>
                </div>

                {/* Variance Factors */}
                {prediction.factors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">Contributing Factors</h3>
                    <div className="space-y-2">
                      {prediction.factors.map((factor, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3">
                          <div>
                            <p className="font-medium">{factor.factor}</p>
                            <p className="text-sm text-gray-500">{factor.description}</p>
                          </div>
                          <span className="text-orange-600 font-medium">{factor.impact}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {prediction.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Recommendations</h3>
                    <div className="space-y-2">
                      {prediction.recommendations.map((rec, i) => (
                        <div key={i} className="bg-purple-50 rounded p-3 border border-purple-100">
                          <p className="font-medium text-purple-900">{rec.title}: {rec.value}</p>
                          <p className="text-sm text-purple-700">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comparison Results */}
            {comparison && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Scenario Comparison</h2>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 rounded p-4 border border-green-200">
                    <p className="text-sm text-green-700">Lowest Cost</p>
                    <p className="font-bold text-green-900">{comparison.summary.lowestCost}</p>
                  </div>
                  <div className="bg-blue-50 rounded p-4 border border-blue-200">
                    <p className="text-sm text-blue-700">Recommended</p>
                    <p className="font-bold text-blue-900">{comparison.summary.recommended}</p>
                  </div>
                </div>

                {/* Scenario Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Scenario</th>
                        <th className="text-right py-2 px-3">Impact</th>
                        <th className="text-right py-2 px-3">New Total</th>
                        <th className="text-right py-2 px-3">Change</th>
                        <th className="text-center py-2 px-3">Risks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.scenarios.map((s: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3 font-medium">{s.name}</td>
                          <td className={`py-3 px-3 text-right ${s.analysis.totalImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(s.analysis.totalImpact)}
                          </td>
                          <td className="py-3 px-3 text-right font-medium">
                            {formatCurrency(s.analysis.newTotal)}
                          </td>
                          <td className={`py-3 px-3 text-right ${s.analysis.percentChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatPercent(s.analysis.percentChange)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center">
                              {s.analysis.riskFactors.filter((r: Risk) => r.level === 'high').length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                              )}
                              {s.analysis.riskFactors.filter((r: Risk) => r.level === 'medium').length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                              )}
                              {s.analysis.riskFactors.filter((r: Risk) => r.level === 'high').length === 0 &&
                               s.analysis.riskFactors.filter((r: Risk) => r.level === 'medium').length === 0 && (
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!analysis && !prediction && !comparison && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">?</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No Analysis Yet</h3>
                <p className="text-gray-500">
                  Configure your baseline, add scenario changes, and click Analyze to see the budget impact.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
