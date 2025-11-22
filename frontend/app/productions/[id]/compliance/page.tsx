'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Violation {
  line_item_id: string;
  account_code: string;
  position_title: string;
  current_rate: number;
  minimum_rate: number;
  rate_card_classification: string;
  union_local: string;
  unit: string;
  shortfall: string;
  shortfall_pct: string;
  severity: 'critical' | 'warning';
}

interface Warning {
  line_item_id: string;
  account_code: string;
  position_title: string;
  current_rate: number;
  minimum_rate: number;
  message: string;
}

interface ComplianceResult {
  success: boolean;
  production_id: string;
  production_name: string;
  is_union_signatory: boolean;
  agreements: {
    iatse: string | null;
    sag_aftra: string | null;
    dga: string | null;
  };
  summary: {
    total_line_items_checked: number;
    compliant_count: number;
    violation_count: number;
    warning_count: number;
    compliance_score: number;
    total_shortfall: string;
    status: 'COMPLIANT' | 'CRITICAL' | 'VIOLATIONS';
  };
  violations: Violation[];
  warnings?: Warning[];
}

export default function CompliancePage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [includeWarnings, setIncludeWarnings] = useState(true);
  const [expandedViolations, setExpandedViolations] = useState<Set<string>>(new Set());

  const runComplianceCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/compliance-check?include_warnings=${includeWarnings}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to run compliance check');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComplianceCheck();
  }, [productionId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Compliant
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Critical Violations
          </span>
        );
      case 'VIOLATIONS':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            Violations Found
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const toggleViolation = (id: string) => {
    const newSet = new Set(expandedViolations);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedViolations(newSet);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Running compliance check...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center text-red-600">
              <p className="text-lg font-medium">Error</p>
              <p className="mt-2">{error}</p>
              <button
                onClick={runComplianceCheck}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
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
              <h1 className="text-2xl font-bold text-gray-900">CBA Compliance Check</h1>
              <p className="text-sm text-gray-600 mt-1">
                {result?.production_name || 'Production'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={includeWarnings}
                  onChange={(e) => setIncludeWarnings(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Include warnings</span>
              </label>
              <button
                onClick={runComplianceCheck}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Re-run Check
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        {result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Compliance Score */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Compliance Score</div>
                <div className={`text-3xl font-bold ${
                  result.summary.compliance_score >= 90 ? 'text-green-600' :
                  result.summary.compliance_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {result.summary.compliance_score}%
                </div>
                <div className="mt-2">{getStatusBadge(result.summary.status)}</div>
              </div>

              {/* Items Checked */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Line Items Checked</div>
                <div className="text-3xl font-bold text-gray-900">
                  {result.summary.total_line_items_checked}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {result.summary.compliant_count} compliant
                </div>
              </div>

              {/* Violations */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Violations</div>
                <div className={`text-3xl font-bold ${
                  result.summary.violation_count === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.summary.violation_count}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {result.violations.filter(v => v.severity === 'critical').length} critical
                </div>
              </div>

              {/* Total Shortfall */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Total Shortfall</div>
                <div className={`text-3xl font-bold ${
                  parseFloat(result.summary.total_shortfall) === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(parseFloat(result.summary.total_shortfall))}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Below minimum rates
                </div>
              </div>
            </div>

            {/* Agreements */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Agreements</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">IATSE</div>
                  <div className="font-medium text-gray-900">
                    {result.agreements.iatse || 'Not specified'}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">SAG-AFTRA</div>
                  <div className="font-medium text-gray-900">
                    {result.agreements.sag_aftra || 'Not specified'}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">DGA</div>
                  <div className="font-medium text-gray-900">
                    {result.agreements.dga || 'Not specified'}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className={`px-2 py-1 rounded ${
                  result.is_union_signatory ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {result.is_union_signatory ? 'Union Signatory' : 'Non-Union'}
                </span>
              </div>
            </div>

            {/* Violations List */}
            {result.violations.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Violations ({result.violations.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {result.violations.map((violation) => (
                    <div
                      key={violation.line_item_id}
                      className={`px-6 py-4 ${
                        violation.severity === 'critical' ? 'bg-red-50' : 'bg-yellow-50'
                      }`}
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleViolation(violation.line_item_id)}
                      >
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            violation.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {violation.severity.toUpperCase()}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {violation.account_code} - {violation.position_title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {violation.union_local}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-600 font-medium">
                            -{formatCurrency(parseFloat(violation.shortfall))} ({violation.shortfall_pct}%)
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(violation.current_rate)} vs {formatCurrency(violation.minimum_rate)} min
                          </div>
                        </div>
                      </div>
                      {expandedViolations.has(violation.line_item_id) && (
                        <div className="mt-4 pl-10 text-sm text-gray-600">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Matched Rate Card:</span> {violation.rate_card_classification}
                            </div>
                            <div>
                              <span className="font-medium">Unit:</span> {violation.unit}
                            </div>
                          </div>
                          <div className="mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/productions/${productionId}/budget?highlight=${violation.line_item_id}`);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              View in Budget →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings List */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Warnings ({result.warnings.length})
                  </h2>
                  <p className="text-sm text-gray-500">Rates within 5% of minimum</p>
                </div>
                <div className="divide-y divide-gray-200">
                  {result.warnings.map((warning) => (
                    <div key={warning.line_item_id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {warning.account_code} - {warning.position_title}
                          </div>
                          <div className="text-sm text-gray-500">{warning.message}</div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          {formatCurrency(warning.current_rate)} / {formatCurrency(warning.minimum_rate)} min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Clear */}
            {result.summary.status === 'COMPLIANT' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <div className="text-green-600 text-4xl mb-4">✓</div>
                <h3 className="text-lg font-semibold text-green-800">All Clear!</h3>
                <p className="text-green-700 mt-2">
                  All checked line items meet or exceed CBA minimum rates.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
