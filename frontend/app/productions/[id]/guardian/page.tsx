'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Violation {
  lineItemId: string | null;
  description: string;
  accountCode: string;
  currentRate: number;
  currentTotal: number;
  violation: {
    type: string;
    message: string;
    union?: string;
    minimumRate?: number;
    rateType?: string;
  };
  fix?: {
    action: string;
    newRate?: number;
    reason: string;
    cost?: number;
  };
  budgetImpact: number;
}

interface Warning {
  lineItemId: string | null;
  description?: string;
  type: string;
  message: string;
  recommendation?: string;
  warning?: {
    type: string;
    message: string;
    expectedFringes?: number;
  };
}

interface TaxIncentive {
  location: string;
  programName: string;
  eligible: boolean;
  qualifiedSpend?: number;
  qualifiedPercent?: string;
  baseRate?: number;
  baseCredit?: number;
  cappedCredit?: number;
  effectiveRate?: string;
  potentialBonuses?: { name: string; rate: number; applied: boolean; potentialValue: number }[];
  recommendations?: string[];
  message?: string;
}

interface Recommendation {
  priority: string;
  category: string;
  title: string;
  description: string;
  estimatedCost?: number;
  potentialSavings?: number;
  items?: any[];
  recommendations?: string[];
}

interface Audit {
  budgetId: string;
  productionType: string;
  timestamp: string;
  summary: {
    totalItems: number;
    compliant: number;
    warnings: number;
    violations: number;
    totalBudgetImpact: number;
  };
  violations: Violation[];
  warnings: Warning[];
  recommendations: Recommendation[];
  taxIncentives: TaxIncentive[];
  complianceScore: number;
}

interface RateCheckResult {
  valid: boolean;
  message: string;
  minimumRate?: number;
  union?: string;
  difference?: number;
  margin?: number;
  warning?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function BudgetGuardian() {
  const params = useParams();
  const productionId = params.id as string;

  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Rate checker state
  const [rateCheck, setRateCheck] = useState({
    position: '',
    rate: '',
    productionType: 'theatrical',
    location: 'Los Angeles'
  });
  const [rateResult, setRateResult] = useState<RateCheckResult | null>(null);
  const [checkingRate, setCheckingRate] = useState(false);

  // Tax programs
  const [taxPrograms, setTaxPrograms] = useState<any[]>([]);
  const [showTaxPrograms, setShowTaxPrograms] = useState(false);

  useEffect(() => {
    if (productionId && productionId !== 'new') {
      runAudit();
    }
    fetchTaxPrograms();
  }, [productionId]);

  const runAudit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/ai/guardian/audit/${productionId}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setAudit(data.audit);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchTaxPrograms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/guardian/tax-programs`);
      const data = await response.json();
      if (data.success) {
        setTaxPrograms(data.programs);
      }
    } catch (err) {
      console.error('Failed to fetch tax programs:', err);
    }
  };

  const checkRate = async () => {
    if (!rateCheck.position || !rateCheck.rate) return;

    setCheckingRate(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/guardian/check-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: rateCheck.position,
          rate: parseFloat(rateCheck.rate),
          productionType: rateCheck.productionType,
          location: rateCheck.location
        }),
      });
      const data = await response.json();
      if (data.success) {
        setRateResult(data);
      }
    } catch (err: any) {
      console.error('Rate check failed:', err);
    }
    setCheckingRate(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Budget Guardian</h1>
              <p className="text-gray-500 text-sm">Compliance auditing, rate validation, and tax incentive optimization</p>
            </div>
            <button
              onClick={runAudit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Auditing...' : 'Run Audit'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Tools */}
          <div className="lg:col-span-1 space-y-4">
            {/* Compliance Score */}
            {audit && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Compliance Score</h2>
                <div className={`text-center p-6 rounded-lg ${getScoreColor(audit.complianceScore)}`}>
                  <div className="text-5xl font-bold">{audit.complianceScore}</div>
                  <div className="text-sm mt-1">out of 100</div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items Reviewed</span>
                    <span className="font-medium">{audit.summary.totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Compliant</span>
                    <span className="font-medium text-green-600">{audit.summary.compliant}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Warnings</span>
                    <span className="font-medium text-yellow-600">{audit.summary.warnings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Violations</span>
                    <span className="font-medium text-red-600">{audit.summary.violations}</span>
                  </div>
                  {audit.summary.totalBudgetImpact > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600">Budget Impact</span>
                      <span className="font-medium text-red-600">+{formatCurrency(audit.summary.totalBudgetImpact)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rate Checker */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Rate Checker</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Position</label>
                  <input
                    type="text"
                    value={rateCheck.position}
                    onChange={(e) => setRateCheck(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g., Director of Photography"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rate ($)</label>
                  <input
                    type="number"
                    value={rateCheck.rate}
                    onChange={(e) => setRateCheck(prev => ({ ...prev, rate: e.target.value }))}
                    placeholder="e.g., 5000"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Production Type</label>
                    <select
                      value={rateCheck.productionType}
                      onChange={(e) => setRateCheck(prev => ({ ...prev, productionType: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="theatrical">Theatrical</option>
                      <option value="hbsvod">HBSVOD</option>
                      <option value="television">Television</option>
                      <option value="indie">Indie</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Location</label>
                    <select
                      value={rateCheck.location}
                      onChange={(e) => setRateCheck(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="Los Angeles">Los Angeles</option>
                      <option value="New York">New York</option>
                      <option value="Atlanta">Atlanta</option>
                      <option value="National">National</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={checkRate}
                  disabled={checkingRate || !rateCheck.position || !rateCheck.rate}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {checkingRate ? 'Checking...' : 'Check Rate'}
                </button>

                {rateResult && (
                  <div className={`p-3 rounded ${rateResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`font-medium ${rateResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                      {rateResult.valid ? 'Rate is Compliant' : 'Rate Violation'}
                    </div>
                    <p className="text-sm mt-1">{rateResult.message}</p>
                    {rateResult.minimumRate && (
                      <p className="text-sm mt-1">
                        Minimum: {formatCurrency(rateResult.minimumRate)} ({rateResult.union})
                      </p>
                    )}
                    {rateResult.difference && (
                      <p className="text-sm text-red-600 mt-1">
                        Underpaid by: {formatCurrency(rateResult.difference)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tax Programs Quick View */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Tax Incentive Programs</h2>
                <button
                  onClick={() => setShowTaxPrograms(!showTaxPrograms)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showTaxPrograms ? 'Hide' : 'Show All'}
                </button>
              </div>

              {showTaxPrograms && taxPrograms.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {taxPrograms.map((program, i) => (
                    <div key={i} className="bg-gray-50 rounded p-2 text-sm">
                      <div className="font-medium">{program.location}</div>
                      <div className="text-gray-600">{program.name}</div>
                      <div className="text-green-600">{(program.creditRate * 100).toFixed(0)}% base credit</div>
                    </div>
                  ))}
                </div>
              )}

              {!showTaxPrograms && (
                <p className="text-sm text-gray-600">
                  {taxPrograms.length} programs available. Click to view all.
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Audit Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Violations */}
            {audit && audit.violations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  Violations ({audit.violations.length})
                </h2>
                <div className="space-y-3">
                  {audit.violations.map((violation, i) => (
                    <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-red-900">{violation.description || 'Budget Violation'}</p>
                          {violation.violation && (
                            <p className="text-sm text-red-700 mt-1">{violation.violation.message}</p>
                          )}
                          {violation.accountCode && (
                            <p className="text-xs text-red-600 mt-1">Account: {violation.accountCode}</p>
                          )}
                        </div>
                        {violation.budgetImpact > 0 && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                            +{formatCurrency(violation.budgetImpact)}
                          </span>
                        )}
                      </div>
                      {violation.fix && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-sm text-red-800">
                            <strong>Fix:</strong> {violation.fix.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {audit && audit.warnings.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                  Warnings ({audit.warnings.length})
                </h2>
                <div className="space-y-3">
                  {audit.warnings.slice(0, 10).map((warning, i) => (
                    <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                      <p className="font-medium text-yellow-900">
                        {warning.warning?.message || warning.message}
                      </p>
                      {warning.description && (
                        <p className="text-sm text-yellow-700 mt-1">{warning.description}</p>
                      )}
                      {warning.recommendation && (
                        <p className="text-sm text-yellow-800 mt-2">
                          <strong>Recommendation:</strong> {warning.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                  {audit.warnings.length > 10 && (
                    <p className="text-sm text-gray-500 text-center">
                      + {audit.warnings.length - 10} more warnings
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tax Incentives */}
            {audit && audit.taxIncentives.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  Tax Incentive Opportunities
                </h2>
                <div className="space-y-4">
                  {audit.taxIncentives.map((incentive, i) => (
                    <div key={i} className={`rounded-lg p-4 ${incentive.eligible ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{incentive.programName || incentive.location}</p>
                          <p className="text-sm text-gray-600">{incentive.location}</p>
                        </div>
                        {incentive.eligible && incentive.cappedCredit && (
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">{formatCurrency(incentive.cappedCredit)}</p>
                            <p className="text-sm text-green-700">{incentive.effectiveRate}% effective</p>
                          </div>
                        )}
                      </div>

                      {incentive.eligible && (
                        <>
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Qualified Spend</p>
                              <p className="font-medium">{formatCurrency(incentive.qualifiedSpend || 0)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Base Rate</p>
                              <p className="font-medium">{((incentive.baseRate || 0) * 100).toFixed(0)}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Qualified %</p>
                              <p className="font-medium">{incentive.qualifiedPercent}%</p>
                            </div>
                          </div>

                          {incentive.potentialBonuses && incentive.potentialBonuses.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-green-200">
                              <p className="text-sm font-medium text-green-800 mb-2">Potential Bonuses:</p>
                              <div className="flex flex-wrap gap-2">
                                {incentive.potentialBonuses.map((bonus, j) => (
                                  <span key={j} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                    {bonus.name}: +{(bonus.rate * 100).toFixed(0)}%
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {!incentive.eligible && incentive.message && (
                        <p className="text-sm text-gray-600 mt-2">{incentive.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {audit && audit.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Recommendations</h2>
                <div className="space-y-3">
                  {audit.recommendations.map((rec, i) => (
                    <div key={i} className={`rounded-lg p-4 border ${getPriorityColor(rec.priority)}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-medium uppercase">{rec.priority}</span>
                          <p className="font-medium mt-1">{rec.title}</p>
                          <p className="text-sm mt-1 opacity-80">{rec.description}</p>
                        </div>
                        {rec.potentialSavings && rec.potentialSavings > 0 && (
                          <span className="text-green-600 font-medium whitespace-nowrap ml-4">
                            Save {formatCurrency(rec.potentialSavings)}
                          </span>
                        )}
                        {rec.estimatedCost && rec.estimatedCost > 0 && (
                          <span className="text-red-600 font-medium whitespace-nowrap ml-4">
                            Cost {formatCurrency(rec.estimatedCost)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!audit && !loading && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">&#128737;</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No Audit Results</h3>
                <p className="text-gray-500 mb-6">
                  Click "Run Audit" to analyze your budget for compliance issues and tax incentive opportunities.
                </p>
                <button
                  onClick={runAudit}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Run Compliance Audit
                </button>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin text-4xl mb-4">&#9881;</div>
                <p className="text-gray-600">Analyzing budget compliance...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
