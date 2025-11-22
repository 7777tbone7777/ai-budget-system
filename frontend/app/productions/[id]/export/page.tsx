'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Production {
  id: string;
  name: string;
  production_type: string;
  shooting_location: string;
}

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'topsheet' | 'detail' | 'full'>('topsheet');

  useEffect(() => {
    const fetchProduction = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}`
        );
        if (res.ok) {
          const data = await res.json();
          setProduction(data.data);
        }
      } catch (err) {
        console.error('Error fetching production:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduction();
  }, [productionId]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/productions/${productionId}/export/pdf?format=${exportFormat}`;

      // Open in new tab to trigger download
      window.open(url, '_blank');
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">PDF Export Options</h2>

          <div className="space-y-4">
            {/* Topsheet */}
            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="format"
                value="topsheet"
                checked={exportFormat === 'topsheet'}
                onChange={() => setExportFormat('topsheet')}
                className="mt-1 mr-4"
              />
              <div>
                <div className="font-medium text-gray-900">Topsheet Only</div>
                <div className="text-sm text-gray-500">
                  Summary view with category totals. Ideal for executive review and quick budget overview.
                </div>
                <div className="text-xs text-gray-400 mt-1">Typically 1-2 pages</div>
              </div>
            </label>

            {/* Detail */}
            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="format"
                value="detail"
                checked={exportFormat === 'detail'}
                onChange={() => setExportFormat('detail')}
                className="mt-1 mr-4"
              />
              <div>
                <div className="font-medium text-gray-900">Topsheet + Detail</div>
                <div className="text-sm text-gray-500">
                  Full budget detail with all line items organized by category.
                  Includes account codes, descriptions, rates, quantities, and totals.
                </div>
                <div className="text-xs text-gray-400 mt-1">Variable length based on budget size</div>
              </div>
            </label>

            {/* Full */}
            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="format"
                value="full"
                checked={exportFormat === 'full'}
                onChange={() => setExportFormat('full')}
                className="mt-1 mr-4"
              />
              <div>
                <div className="font-medium text-gray-900">Complete Budget Package</div>
                <div className="text-sm text-gray-500">
                  Comprehensive export including topsheet, full detail pages, and all budget notes.
                  Best for archival and complete documentation.
                </div>
                <div className="text-xs text-gray-400 mt-1">Full comprehensive report</div>
              </div>
            </label>
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
