'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Production {
  id: string;
  name: string;
  production_type: string;
  shooting_location: string;
}

interface ExportOptions {
  format: 'topsheet' | 'detail' | 'full' | 'comparison' | 'view';
  includeNotes: boolean;
  includeFringes: boolean;
  includeVariance: boolean;
  viewFilter?: string;
  headerStyle: 'standard' | 'minimal' | 'detailed';
  showZeroItems: boolean;
  groupByDepartment: boolean;
}

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'topsheet' | 'detail' | 'full'>('topsheet');
  const [options, setOptions] = useState<ExportOptions>({
    format: 'topsheet',
    includeNotes: false,
    includeFringes: true,
    includeVariance: false,
    headerStyle: 'standard',
    showZeroItems: false,
    groupByDepartment: true,
  });
  const [savedViews, setSavedViews] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, viewsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/views/saved`)
        ]);
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProduction(data.data);
        }
        if (viewsRes.ok) {
          const viewsData = await viewsRes.json();
          setSavedViews(viewsData.data || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productionId]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        format: options.format,
        includeNotes: options.includeNotes.toString(),
        includeFringes: options.includeFringes.toString(),
        includeVariance: options.includeVariance.toString(),
        headerStyle: options.headerStyle,
        showZeroItems: options.showZeroItems.toString(),
        groupByDepartment: options.groupByDepartment.toString(),
      });
      if (options.viewFilter) {
        params.append('viewFilter', options.viewFilter);
      }
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/export/pdf?${params.toString()}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2"
          >
            ← Back to Production
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Export Budget</h1>
          <p className="text-sm text-gray-600 mt-1">
            {production?.name || 'Production'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Export Format Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { id: 'topsheet', label: 'Topsheet', desc: '1-2 pages' },
              { id: 'detail', label: 'Detail', desc: 'Full breakdown' },
              { id: 'full', label: 'Complete', desc: 'With notes' },
              { id: 'comparison', label: 'Variance', desc: 'Orig vs Current' },
              { id: 'view', label: 'Custom View', desc: 'Filtered data' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => updateOption('format', fmt.id as ExportOptions['format'])}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  options.format === fmt.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{fmt.label}</div>
                <div className="text-xs text-gray-500">{fmt.desc}</div>
              </button>
            ))}
          </div>

          {/* View Selection (if custom view) */}
          {options.format === 'view' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Saved View</label>
              <select
                value={options.viewFilter || ''}
                onChange={(e) => updateOption('viewFilter', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select a view --</option>
                <option value="atl">Above the Line</option>
                <option value="btl">Below the Line</option>
                <option value="labor">Labor Only</option>
                <option value="post">Post Production</option>
                {savedViews.map((view) => (
                  <option key={view.id} value={view.id}>{view.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Export Options */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-medium text-gray-900">Export Options</h3>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeFringes}
                  onChange={(e) => updateOption('includeFringes', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include fringe breakdown</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeVariance}
                  onChange={(e) => updateOption('includeVariance', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show variance column</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeNotes}
                  onChange={(e) => updateOption('includeNotes', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include line item notes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showZeroItems}
                  onChange={(e) => updateOption('showZeroItems', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show zero-value items</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.groupByDepartment}
                  onChange={(e) => updateOption('groupByDepartment', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Group by department</span>
              </label>
            </div>

            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Header Style</label>
              <div className="flex gap-3">
                {[
                  { id: 'minimal', label: 'Minimal' },
                  { id: 'standard', label: 'Standard' },
                  { id: 'detailed', label: 'Detailed' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateOption('headerStyle', style.id as ExportOptions['headerStyle'])}
                    className={`px-4 py-2 rounded border text-sm ${
                      options.headerStyle === style.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {exporting ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Other Export Options */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Export Formats</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="font-medium text-gray-600">Excel Export</div>
              <div className="text-xs text-gray-400">Coming soon</div>
            </div>

            <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
              <div className="font-medium text-gray-600">Movie Magic Export</div>
              <div className="text-xs text-gray-400">Coming soon</div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3">Related Tools</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(`/productions/${productionId}/comparison`)}
              className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded hover:bg-gray-50 border border-gray-200"
            >
              Budget Comparison
            </button>
            <button
              onClick={() => router.push(`/productions/${productionId}/compliance`)}
              className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded hover:bg-gray-50 border border-gray-200"
            >
              Compliance Check
            </button>
            <button
              onClick={() => router.push(`/productions/${productionId}/charges`)}
              className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded hover:bg-gray-50 border border-gray-200"
            >
              Contractual Charges
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
