'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  description: string;
  production_type: string;
  line_count: number;
  total_amount: number;
  is_public: boolean;
  created_by?: string;
  created_at: string;
}

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'feature', label: 'Feature Film' },
  { id: 'tv', label: 'TV Series' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'custom', label: 'My Templates' },
];

// Built-in templates (simulated)
const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'feature-low',
    name: 'Low Budget Feature',
    description: 'Standard template for features under $5M with minimal crew',
    production_type: 'Feature Film',
    line_count: 180,
    total_amount: 3500000,
    is_public: true,
    created_at: '2024-01-01',
  },
  {
    id: 'feature-mid',
    name: 'Mid Budget Feature',
    description: 'Full crew template for $5M-$15M theatrical features',
    production_type: 'Feature Film',
    line_count: 320,
    total_amount: 12000000,
    is_public: true,
    created_at: '2024-01-01',
  },
  {
    id: 'feature-studio',
    name: 'Studio Feature',
    description: 'Comprehensive template for studio productions $15M+',
    production_type: 'Feature Film',
    line_count: 450,
    total_amount: 35000000,
    is_public: true,
    created_at: '2024-01-01',
  },
  {
    id: 'tv-drama',
    name: 'TV Drama Pilot',
    description: '1-hour drama pilot with standard network requirements',
    production_type: 'TV Series',
    line_count: 280,
    total_amount: 8500000,
    is_public: true,
    created_at: '2024-01-01',
  },
  {
    id: 'tv-comedy',
    name: 'TV Comedy (Multi-cam)',
    description: '30-minute multi-camera sitcom template',
    production_type: 'TV Series',
    line_count: 160,
    total_amount: 2800000,
    is_public: true,
    created_at: '2024-01-01',
  },
  {
    id: 'commercial-national',
    name: 'National Commercial',
    description: 'Full production commercial with union cast and crew',
    production_type: 'Commercial',
    line_count: 120,
    total_amount: 850000,
    is_public: true,
    created_at: '2024-01-01',
  },
  {
    id: 'documentary-indie',
    name: 'Independent Documentary',
    description: 'Lean documentary template with minimal crew',
    production_type: 'Documentary',
    line_count: 85,
    total_amount: 450000,
    is_public: true,
    created_at: '2024-01-01',
  },
];

export default function TemplateLibraryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>(BUILTIN_TEMPLATES);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    const fetchCustomTemplates = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/templates`
        );
        if (res.ok) {
          const data = await res.json();
          setCustomTemplates(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomTemplates();
  }, []);

  const filteredTemplates = [...BUILTIN_TEMPLATES, ...customTemplates].filter((template) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'custom' && !BUILTIN_TEMPLATES.includes(template)) ||
      template.production_type.toLowerCase().includes(selectedCategory);
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApplyTemplate = (template: Template) => {
    // Store template in session storage and redirect to create production
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template));
    router.push('/productions/new?template=' + template.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-700 text-sm mb-2"
              >
                &#8592; Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
              <p className="text-sm text-gray-600 mt-1">
                Start from a professionally-designed budget template
              </p>
            </div>
            <button
              onClick={() => router.push('/templates/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Template
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Old Way vs New Way Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Smart Import vs. MMB Copy/Paste</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-red-600 font-medium">Old Way:</span>
              <span className="text-gray-600 ml-2">Open multiple budget files, manually copy line items, fix broken formulas</span>
            </div>
            <div>
              <span className="text-green-600 font-medium">New Way:</span>
              <span className="text-gray-600 ml-2">One-click template import with all formulas intact, ready to customize</span>
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer ${
                selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {template.production_type}
                    </span>
                  </div>
                  {!BUILTIN_TEMPLATES.find((t) => t.id === template.id) && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>{template.line_count} line items</span>
                  <span>{formatCurrency(template.total_amount)}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyTemplate(template);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Use This Template
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-4xl mb-4">&#128269;</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Template Detail Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                    <span className="text-sm text-gray-500">{selectedTemplate.production_type}</span>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    &#10005;
                  </button>
                </div>
                <p className="text-gray-600 mb-6">{selectedTemplate.description}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded p-4">
                    <div className="text-sm text-gray-500">Line Items</div>
                    <div className="text-2xl font-bold">{selectedTemplate.line_count}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-4">
                    <div className="text-sm text-gray-500">Total Budget</div>
                    <div className="text-2xl font-bold">{formatCurrency(selectedTemplate.total_amount)}</div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">What is included:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>&#8226; All standard budget categories and accounts</li>
                    <li>&#8226; Pre-configured line items with formulas</li>
                    <li>&#8226; Union rate placeholders (customize for your location)</li>
                    <li>&#8226; Standard fringe and overhead calculations</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApplyTemplate(selectedTemplate)}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Create Production with Template
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
