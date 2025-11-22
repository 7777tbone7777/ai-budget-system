'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Section = 'quick-start' | 'productions' | 'budget-editor' | 'ai-generator' | 'compliance' |
  'comparison' | 'charges' | 'export' | 'rate-cards' | 'tax-incentives' | 'globals' | 'tools' | 'future' |
  'crew-builder' | 'what-if' | 'guardian' | 'nested-items' | 'dynamic-views' | 'access-control';

interface FeatureStatus {
  available: boolean;
  label: string;
}

const featureStatuses: Record<string, FeatureStatus> = {
  // Available features
  'productions': { available: true, label: 'Available' },
  'budget-editor': { available: true, label: 'Available' },
  'ai-generator': { available: true, label: 'Available' },
  'compliance': { available: true, label: 'Available' },
  'comparison': { available: true, label: 'Available' },
  'charges': { available: true, label: 'Available' },
  'export-pdf': { available: true, label: 'Available' },
  'rate-cards': { available: true, label: 'Available' },
  'tax-incentives': { available: true, label: 'Available' },
  'globals': { available: true, label: 'Available' },
  'crew-templates': { available: true, label: 'Available' },
  'budget-groups': { available: true, label: 'Available' },
  // AI Enhancements
  'crew-builder': { available: true, label: 'New' },
  'what-if': { available: true, label: 'New' },
  'guardian': { available: true, label: 'New' },
  // Modern Features
  'nested-items': { available: true, label: 'New' },
  'dynamic-views': { available: true, label: 'New' },
  'access-control': { available: true, label: 'New' },
  // Future features
  'actuals': { available: false, label: 'Coming Soon' },
  'excel-import': { available: false, label: 'Coming Soon' },
  'cost-reports': { available: false, label: 'Coming Soon' },
  'versions': { available: false, label: 'Coming Soon' },
  'amortization': { available: false, label: 'Coming Soon' },
  'user-roles': { available: false, label: 'Coming Soon' },
  'hot-costs': { available: false, label: 'Coming Soon' },
  'payroll-integration': { available: false, label: 'Coming Soon' },
  'mobile': { available: false, label: 'Coming Soon' },
  'audit-trail': { available: false, label: 'Coming Soon' },
  'dashboard': { available: false, label: 'Coming Soon' },
};

export default function UserGuidePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('quick-start');

  const sections = [
    { id: 'quick-start', label: 'Quick Start', icon: '🚀' },
    { id: 'productions', label: 'Productions', icon: '🎬' },
    { id: 'budget-editor', label: 'Budget Editor', icon: '📊' },
    { id: 'ai-generator', label: 'AI Budget Generator', icon: '🤖' },
    // AI Enhancements
    { id: 'crew-builder', label: 'Smart Crew Builder', icon: '👥', isNew: true },
    { id: 'what-if', label: 'What-If Analyzer', icon: '🔮', isNew: true },
    { id: 'guardian', label: 'Budget Guardian', icon: '🛡️', isNew: true },
    // Modern Features
    { id: 'nested-items', label: 'Nested Line Items', icon: '📋', isNew: true },
    { id: 'dynamic-views', label: 'Dynamic Views', icon: '👁️', isNew: true },
    { id: 'access-control', label: 'Access & Sharing', icon: '🔐', isNew: true },
    // Original sections
    { id: 'compliance', label: 'CBA Compliance', icon: '✓' },
    { id: 'comparison', label: 'Budget Comparison', icon: '📈' },
    { id: 'charges', label: 'Contractual Charges', icon: '💰' },
    { id: 'export', label: 'PDF Export', icon: '📄' },
    { id: 'rate-cards', label: 'Rate Cards', icon: '💵' },
    { id: 'tax-incentives', label: 'Tax Incentives', icon: '🏛️' },
    { id: 'globals', label: 'Globals & Fringes', icon: '⚙️' },
    { id: 'tools', label: 'Tools & Calculators', icon: '🔧' },
    { id: 'future', label: 'Roadmap', icon: '🗺️' },
  ];

  const StatusBadge = ({ featureKey }: { featureKey: string }) => {
    const status = featureStatuses[featureKey];
    if (!status) return null;
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${
        status.available ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {status.label}
      </span>
    );
  };

  const ScreenshotPlaceholder = ({ label }: { label: string }) => (
    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 my-4 text-center">
      <div className="text-gray-400 text-4xl mb-2">📷</div>
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-gray-400 text-xs mt-1">Screenshot placeholder</div>
    </div>
  );

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
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">AI Budget System User Guide</h1>
              <p className="text-gray-600 mt-1">
                Complete documentation for Line Producers, UPMs, Production Accountants & Finance Executives
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Version 1.0 | Last updated: November 2024
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 sticky top-0">
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as Section)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Quick Start */}
          {activeSection === 'quick-start' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start Guide</h2>
                <p className="text-gray-600 mb-6">
                  Get up and running with AI Budget System in 5 minutes. This guide walks you through
                  creating your first production budget.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">What You Can Do</h3>
                <ul className="space-y-2 text-blue-800">
                  <li>• Create production budgets with industry-standard account codes</li>
                  <li>• Validate rates against union CBA minimums (IATSE, SAG-AFTRA, DGA)</li>
                  <li>• Generate AI-powered budget scenarios based on your parameters</li>
                  <li>• Track budget variance (Original vs Current)</li>
                  <li>• Export professional PDF topsheets</li>
                  <li>• Compare costs across production locations with tax incentives</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Create a Production</h3>
                <p className="text-gray-600 mb-4">
                  Navigate to <strong>Productions → Create New Production</strong>. Fill in the basic details:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                  <li><strong>Production Name</strong> - Your project title</li>
                  <li><strong>Production Type</strong> - Feature Film, TV Series, Commercial, etc.</li>
                  <li><strong>Shooting Location</strong> - Primary location for union rate lookup</li>
                  <li><strong>Union Signatory</strong> - Whether bound by union agreements</li>
                  <li><strong>Agreement Selection</strong> - Choose IATSE, SAG-AFTRA, DGA agreements</li>
                </ul>
                <ScreenshotPlaceholder label="Create Production Form" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Apply a Crew Template (Optional)</h3>
                <p className="text-gray-600 mb-4">
                  Jump-start your budget by applying a pre-built crew template. Templates are
                  available for different production types and include standard positions with
                  industry rates.
                </p>
                <ScreenshotPlaceholder label="Apply Template Page" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Edit Your Budget</h3>
                <p className="text-gray-600 mb-4">
                  The Budget Editor follows the Movie Magic Budgeting 4-level structure:
                </p>
                <div className="bg-gray-50 rounded p-4 mb-4">
                  <div className="font-mono text-sm">
                    <div className="text-blue-600">Topsheet (Summary)</div>
                    <div className="text-green-600 ml-4">└─ Categories (e.g., 500 - Production Staff)</div>
                    <div className="text-orange-600 ml-8">└─ Accounts (e.g., 510 - Unit Production Manager)</div>
                    <div className="text-purple-600 ml-12">└─ Details (Line Items with rates, quantities)</div>
                  </div>
                </div>
                <ScreenshotPlaceholder label="Budget Editor Interface" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Run Compliance Check</h3>
                <p className="text-gray-600 mb-4">
                  Click <strong>Compliance Check</strong> to validate all rates against union minimums.
                  The system will flag any positions below CBA rates and calculate the shortfall.
                </p>
                <ScreenshotPlaceholder label="Compliance Check Results" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 5: Lock Baseline & Export</h3>
                <p className="text-gray-600 mb-4">
                  Once your budget is approved, lock it as the baseline for variance tracking.
                  Then export a professional PDF topsheet for distribution.
                </p>
                <ScreenshotPlaceholder label="PDF Export Options" />
              </div>
            </div>
          )}

          {/* Productions */}
          {activeSection === 'productions' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Productions</h2>
                  <StatusBadge featureKey="productions" />
                </div>
                <p className="text-gray-600">
                  Productions are the core organizational unit. Each production contains its own budget,
                  union agreements, globals, and line items.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Creating a Production</h3>
                <p className="text-gray-600 mb-4">
                  Navigate to <code className="bg-gray-100 px-2 py-0.5 rounded">/productions/new</code> or
                  click "Create New Production" from the dashboard.
                </p>

                <h4 className="font-medium text-gray-800 mt-6 mb-2">Required Fields:</h4>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border">Field</th>
                      <th className="text-left p-3 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border font-medium">Production Name</td>
                      <td className="p-3 border">The title of your production</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Production Type</td>
                      <td className="p-3 border">Feature Film, TV Series, TV Pilot, Documentary, Commercial, Music Video, Short Film</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Shooting Location</td>
                      <td className="p-3 border">Primary location (affects union rates and tax incentives)</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Union Signatory</td>
                      <td className="p-3 border">Yes/No - determines if CBA compliance checks apply</td>
                    </tr>
                  </tbody>
                </table>

                <h4 className="font-medium text-gray-800 mt-6 mb-2">Optional Fields:</h4>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border">Field</th>
                      <th className="text-left p-3 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border font-medium">Budget Target</td>
                      <td className="p-3 border">Target budget amount for tracking</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Start Date / End Date</td>
                      <td className="p-3 border">Production schedule dates</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">IATSE Agreement</td>
                      <td className="p-3 border">e.g., IATSE West Coast Studio Agreement 2024-2027</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">SAG-AFTRA Agreement</td>
                      <td className="p-3 border">e.g., SAG-AFTRA Theatrical Agreement 2023</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">DGA Agreement</td>
                      <td className="p-3 border">e.g., DGA Basic Agreement 2023-2026</td>
                    </tr>
                  </tbody>
                </table>
                <ScreenshotPlaceholder label="Production Creation Form" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  Each production has its own dashboard with quick access to all tools:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Budget Editor', 'AI Generator', 'Compliance', 'Comparison', 'Charges', 'Export', 'Apply Template', 'Globals'].map((tool) => (
                    <div key={tool} className="bg-gray-50 rounded p-3 text-center text-sm">
                      {tool}
                    </div>
                  ))}
                </div>
                <ScreenshotPlaceholder label="Production Dashboard" />
              </div>
            </div>
          )}

          {/* Budget Editor */}
          {activeSection === 'budget-editor' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Budget Editor</h2>
                  <StatusBadge featureKey="budget-editor" />
                </div>
                <p className="text-gray-600">
                  The Budget Editor is where you create and modify your production budget. It follows
                  the Movie Magic Budgeting 4-level hierarchy.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Structure</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-blue-700">Level 1: Topsheet</h4>
                    <p className="text-gray-600 text-sm">
                      Executive summary showing category totals. This is what gets exported in the PDF topsheet.
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-green-700">Level 2: Categories</h4>
                    <p className="text-gray-600 text-sm">
                      Major budget groupings (e.g., 500 - Production Staff, 600 - Camera, 700 - Sound).
                      Categories are organized into Above-the-Line and Below-the-Line.
                    </p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-medium text-orange-700">Level 3: Accounts</h4>
                    <p className="text-gray-600 text-sm">
                      Specific positions or expense types within categories (e.g., 510 - Unit Production Manager).
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-purple-700">Level 4: Details (Line Items)</h4>
                    <p className="text-gray-600 text-sm">
                      Individual line items with rate, quantity, unit, and calculated totals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Adding Line Items</h3>
                <p className="text-gray-600 mb-4">
                  Each line item contains the following fields:
                </p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border">Field</th>
                      <th className="text-left p-3 border">Description</th>
                      <th className="text-left p-3 border">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border font-medium">Account Code</td>
                      <td className="p-3 border">Standard budget code</td>
                      <td className="p-3 border">510</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Position Title</td>
                      <td className="p-3 border">Job title or description</td>
                      <td className="p-3 border">Unit Production Manager</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Rate</td>
                      <td className="p-3 border">Pay rate amount</td>
                      <td className="p-3 border">$4,500.00</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Unit</td>
                      <td className="p-3 border">Rate period</td>
                      <td className="p-3 border">Week, Day, Hour, Flat</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Quantity</td>
                      <td className="p-3 border">Number of units</td>
                      <td className="p-3 border">12</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Multiplier</td>
                      <td className="p-3 border">Additional factor (e.g., OT)</td>
                      <td className="p-3 border">1.5</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Fringe %</td>
                      <td className="p-3 border">Benefits/taxes percentage</td>
                      <td className="p-3 border">25%</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-4 bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Formula:</strong> Subtotal = Rate × Quantity × Multiplier<br/>
                    <strong>Total:</strong> Total = Subtotal × (1 + Fringe%)
                  </p>
                </div>
                <ScreenshotPlaceholder label="Line Item Editor" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Union Rate Lookup</h3>
                <p className="text-gray-600 mb-4">
                  When adding line items, you can look up union minimum rates based on:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Position classification (e.g., Director of Photography, Key Grip)</li>
                  <li>Union local (e.g., IATSE Local 600, Local 80)</li>
                  <li>Production type and budget tier</li>
                  <li>Applicable sideletter adjustments</li>
                </ul>
                <ScreenshotPlaceholder label="Rate Lookup Modal" />
              </div>
            </div>
          )}

          {/* AI Generator */}
          {activeSection === 'ai-generator' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">AI Budget Generator</h2>
                  <StatusBadge featureKey="ai-generator" />
                </div>
                <p className="text-gray-600">
                  Generate complete production budgets using AI. Provide your production parameters
                  and let the system create a baseline budget based on industry standards.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-3">
                  <li>
                    <strong>Enter Production Parameters</strong>
                    <p className="ml-6 text-sm">Shooting days, production type, location, union status, budget range</p>
                  </li>
                  <li>
                    <strong>AI Analyzes Requirements</strong>
                    <p className="ml-6 text-sm">The system considers crew requirements, equipment, locations, and union rates</p>
                  </li>
                  <li>
                    <strong>Review Generated Budget</strong>
                    <p className="ml-6 text-sm">See a complete budget breakdown with all standard positions</p>
                  </li>
                  <li>
                    <strong>Apply to Production</strong>
                    <p className="ml-6 text-sm">One-click import to your production budget for further editing</p>
                  </li>
                </ol>
                <ScreenshotPlaceholder label="AI Budget Generator Interface" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Input Parameters</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border">Parameter</th>
                      <th className="text-left p-3 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border font-medium">Production Type</td>
                      <td className="p-3 border">Feature, TV, Commercial, etc.</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Budget Tier</td>
                      <td className="p-3 border">Low, Medium, High, Studio</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Shooting Days</td>
                      <td className="p-3 border">Number of principal photography days</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Prep Weeks</td>
                      <td className="p-3 border">Pre-production period</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Wrap Days</td>
                      <td className="p-3 border">Post-wrap period</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Location</td>
                      <td className="p-3 border">Primary shooting location</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Special Requirements</td>
                      <td className="p-3 border">VFX, Stunts, Underwater, etc.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Note</h4>
                <p className="text-yellow-700 text-sm">
                  AI-generated budgets are starting points. Always review and adjust based on your
                  specific production requirements, deals, and local conditions.
                </p>
              </div>
            </div>
          )}

          {/* CBA Compliance */}
          {activeSection === 'compliance' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">CBA Compliance Check</h2>
                  <StatusBadge featureKey="compliance" />
                </div>
                <p className="text-gray-600">
                  Validate your budget against Collective Bargaining Agreement (CBA) minimum rates
                  for IATSE, SAG-AFTRA, DGA, and other unions.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What Gets Checked</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <div>
                      <strong>Minimum Rate Compliance</strong>
                      <p className="text-sm text-gray-600">Each position rate vs. CBA minimum for that classification</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <div>
                      <strong>Sideletter Adjustments</strong>
                      <p className="text-sm text-gray-600">Location-based and production-type rate modifications</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <div>
                      <strong>Agreement-Specific Rules</strong>
                      <p className="text-sm text-gray-600">Different minimums based on selected union agreements</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Results</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-green-600">95%</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Compliance Score</h4>
                      <p className="text-sm text-gray-600">Percentage of line items meeting or exceeding minimums</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-green-50 rounded p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">45</div>
                      <div className="text-sm text-green-800">Compliant</div>
                    </div>
                    <div className="bg-red-50 rounded p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">3</div>
                      <div className="text-sm text-red-800">Violations</div>
                    </div>
                    <div className="bg-yellow-50 rounded p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">2</div>
                      <div className="text-sm text-yellow-800">Warnings</div>
                    </div>
                  </div>
                </div>
                <ScreenshotPlaceholder label="Compliance Check Results" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Violation Severity Levels</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded">
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">CRITICAL</span>
                    <span className="text-sm">Rate is more than 10% below minimum - immediate attention required</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">WARNING</span>
                    <span className="text-sm">Rate is within 5% of minimum - review recommended</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">COMPLIANT</span>
                    <span className="text-sm">Rate meets or exceeds CBA minimum</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Budget Comparison */}
          {activeSection === 'comparison' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Budget Comparison</h2>
                  <StatusBadge featureKey="comparison" />
                </div>
                <p className="text-gray-600">
                  Track budget variance by comparing your original locked budget against the current
                  working budget. Essential for production accounting.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-3">
                  <li>
                    <strong>Create and refine your budget</strong>
                    <p className="ml-6 text-sm">Build your budget using templates or manual entry</p>
                  </li>
                  <li>
                    <strong>Lock as Baseline</strong>
                    <p className="ml-6 text-sm">Click "Lock Current as Baseline" to set the original approved budget</p>
                  </li>
                  <li>
                    <strong>Make changes as needed</strong>
                    <p className="ml-6 text-sm">Edit line items during production</p>
                  </li>
                  <li>
                    <strong>View Variance Report</strong>
                    <p className="ml-6 text-sm">See Original vs Current with variance amounts and percentages</p>
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Variance Report Contents</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Summary Cards:</strong> Original Total, Current Total, Total Variance, Status</li>
                  <li>• <strong>Category Breakdown:</strong> Variance by budget category</li>
                  <li>• <strong>Significant Variances:</strong> Line items with changes over $100</li>
                  <li>• <strong>Status Indicator:</strong> Over Budget, Under Budget, On Budget</li>
                </ul>
                <ScreenshotPlaceholder label="Budget Comparison Report" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Tip</h4>
                <p className="text-blue-700 text-sm">
                  You can unlock the baseline if you need to reset it (e.g., after a major budget revision).
                  This allows you to re-lock with new original values.
                </p>
              </div>
            </div>
          )}

          {/* Contractual Charges */}
          {activeSection === 'charges' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Contractual Charges</h2>
                  <StatusBadge featureKey="charges" />
                </div>
                <p className="text-gray-600">
                  Manage overhead charges, fees, and other contractual obligations that apply to
                  your budget totals.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Charge Types</h3>
                <div className="space-y-4">
                  <div className="border rounded p-4">
                    <h4 className="font-medium">Percentage Charges</h4>
                    <p className="text-sm text-gray-600 mb-2">Applied as a percentage of a budget base</p>
                    <div className="text-sm text-gray-500">Examples: Studio Overhead (15%), Completion Bond (3%)</div>
                  </div>
                  <div className="border rounded p-4">
                    <h4 className="font-medium">Flat Fee Charges</h4>
                    <p className="text-sm text-gray-600 mb-2">Fixed dollar amount</p>
                    <div className="text-sm text-gray-500">Examples: Legal Fees ($50,000), Insurance Premium ($75,000)</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Templates</h3>
                <p className="text-gray-600 mb-4">
                  Common charges can be added with one click:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Studio Overhead (15%)',
                    'Completion Bond (3%)',
                    'Contingency (10%)',
                    'Insurance (2.5%)',
                    'Legal & Accounting',
                    'Financing Fees'
                  ].map((charge) => (
                    <div key={charge} className="bg-gray-50 rounded p-3 text-sm text-center">
                      {charge}
                    </div>
                  ))}
                </div>
                <ScreenshotPlaceholder label="Contractual Charges Manager" />
              </div>
            </div>
          )}

          {/* PDF Export */}
          {activeSection === 'export' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">PDF Export</h2>
                  <StatusBadge featureKey="export-pdf" />
                </div>
                <p className="text-gray-600">
                  Generate professional PDF budget documents for distribution to stakeholders,
                  studios, and financiers.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Formats</h3>
                <div className="space-y-4">
                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Topsheet Only</h4>
                      <span className="text-xs text-gray-500">1-2 pages</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Summary view with category totals. Ideal for executive review and quick budget overview.
                    </p>
                  </div>
                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Topsheet + Detail</h4>
                      <span className="text-xs text-gray-500">Variable length</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Full budget detail with all line items organized by category.
                      Includes account codes, descriptions, rates, quantities, and totals.
                    </p>
                  </div>
                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Complete Budget Package</h4>
                      <span className="text-xs text-gray-500">Comprehensive</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Comprehensive export including topsheet, full detail pages, and all budget notes.
                      Best for archival and complete documentation.
                    </p>
                  </div>
                </div>
                <ScreenshotPlaceholder label="PDF Export Options" />
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Export Formats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-dashed border-gray-300 rounded p-4 text-center">
                    <div className="text-gray-400 text-2xl mb-2">📊</div>
                    <div className="font-medium text-gray-600">Excel Export</div>
                    <StatusBadge featureKey="excel-import" />
                  </div>
                  <div className="bg-white border border-dashed border-gray-300 rounded p-4 text-center">
                    <div className="text-gray-400 text-2xl mb-2">🎬</div>
                    <div className="font-medium text-gray-600">Movie Magic Export</div>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rate Cards */}
          {activeSection === 'rate-cards' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Union Rate Cards</h2>
                  <StatusBadge featureKey="rate-cards" />
                </div>
                <p className="text-gray-600">
                  Browse and search union minimum rates from IATSE, SAG-AFTRA, DGA, and other
                  collective bargaining agreements.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Rate Cards</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">IATSE West Coast Studio Agreement</div>
                      <div className="text-sm text-gray-500">2024-2027 rates for major studios</div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">IATSE</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">IATSE Area Standards Agreement</div>
                      <div className="text-sm text-gray-500">Low-budget and independent rates</div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">IATSE</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">SAG-AFTRA Theatrical Agreement</div>
                      <div className="text-sm text-gray-500">Performer minimums for theatrical films</div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">SAG-AFTRA</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">DGA Basic Agreement</div>
                      <div className="text-sm text-gray-500">Director and AD rates</div>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">DGA</span>
                  </div>
                </div>
                <ScreenshotPlaceholder label="Rate Cards Browser" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter</h3>
                <p className="text-gray-600 mb-4">
                  Find specific rates by:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Position title or classification</li>
                  <li>Union (IATSE, SAG-AFTRA, DGA, WGA, Teamsters)</li>
                  <li>Local chapter (e.g., Local 600, Local 80)</li>
                  <li>Agreement type (Studio, Low Budget, New Media)</li>
                  <li>Rate type (Hourly, Daily, Weekly)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tax Incentives */}
          {activeSection === 'tax-incentives' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Tax Incentives</h2>
                  <StatusBadge featureKey="tax-incentives" />
                </div>
                <p className="text-gray-600">
                  Compare production tax incentives across states and countries. Factor incentives
                  into your budget location decisions.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Locations</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { state: 'Georgia', credit: '20-30%' },
                    { state: 'New Mexico', credit: '25-35%' },
                    { state: 'California', credit: '20-25%' },
                    { state: 'New York', credit: '25-35%' },
                    { state: 'Louisiana', credit: '25-40%' },
                    { state: 'UK', credit: '25-45%' },
                  ].map((loc) => (
                    <div key={loc.state} className="border rounded p-3">
                      <div className="font-medium">{loc.state}</div>
                      <div className="text-sm text-green-600">{loc.credit} credit</div>
                    </div>
                  ))}
                </div>
                <ScreenshotPlaceholder label="Tax Incentives Comparison" />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Comparison Tool</h3>
                <p className="text-gray-600 mb-4">
                  Compare your budget across multiple locations to find the best value:
                </p>
                <ol className="list-decimal list-inside text-gray-600 space-y-2">
                  <li>Enter your base budget amount</li>
                  <li>Select locations to compare</li>
                  <li>View estimated tax credits and net costs</li>
                  <li>Factor in local labor rate differences</li>
                </ol>
              </div>
            </div>
          )}

          {/* Globals */}
          {activeSection === 'globals' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Globals & Fringes</h2>
                  <StatusBadge featureKey="globals" />
                </div>
                <p className="text-gray-600">
                  Production-wide variables that apply across your entire budget. Set once,
                  apply everywhere.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Standard Globals</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border">Global</th>
                      <th className="text-left p-3 border">Default</th>
                      <th className="text-left p-3 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border font-medium">Payroll Tax %</td>
                      <td className="p-3 border">22%</td>
                      <td className="p-3 border">Employer payroll taxes (FICA, Medicare, etc.)</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">IATSE Fringes %</td>
                      <td className="p-3 border">25%</td>
                      <td className="p-3 border">Pension, health, vacation for IATSE positions</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">DGA Fringes %</td>
                      <td className="p-3 border">28%</td>
                      <td className="p-3 border">Director/AD benefits package</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">SAG Fringes %</td>
                      <td className="p-3 border">19%</td>
                      <td className="p-3 border">Performer pension and health</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Prep Days</td>
                      <td className="p-3 border">varies</td>
                      <td className="p-3 border">Number of prep days for crew calculations</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Shoot Days</td>
                      <td className="p-3 border">varies</td>
                      <td className="p-3 border">Principal photography days</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-medium">Wrap Days</td>
                      <td className="p-3 border">varies</td>
                      <td className="p-3 border">Post-production wrap period</td>
                    </tr>
                  </tbody>
                </table>
                <ScreenshotPlaceholder label="Globals Editor" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">How Globals Work</h4>
                <p className="text-blue-700 text-sm">
                  Line items can reference globals in their calculations. When you change a global
                  (e.g., increasing shoot days from 30 to 35), all line items using that global
                  automatically recalculate.
                </p>
              </div>
            </div>
          )}

          {/* Tools */}
          {activeSection === 'tools' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tools & Calculators</h2>
                <p className="text-gray-600">
                  Additional utilities for budget planning and analysis.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Calculator</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Quick calculations for rates, quantities, and fringes without creating a full production.
                  </p>
                  <a href="/calculator" className="text-blue-600 hover:text-blue-700 text-sm">
                    Open Calculator →
                  </a>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Comparison</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Side-by-side comparison of production costs across different shooting locations.
                  </p>
                  <a href="/compare" className="text-blue-600 hover:text-blue-700 text-sm">
                    Compare Locations →
                  </a>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Rate Comparison</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Compare rates across different union agreements and locals.
                  </p>
                  <a href="/rate-comparison" className="text-blue-600 hover:text-blue-700 text-sm">
                    Compare Rates →
                  </a>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Formula Tester</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Test and validate budget formulas before applying to your production.
                  </p>
                  <a href="/formula-tester" className="text-blue-600 hover:text-blue-700 text-sm">
                    Test Formulas →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Smart Crew Builder - AI Enhancement */}
          {activeSection === 'crew-builder' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Smart Crew Builder</h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">AI-Powered</span>
                </div>
                <p className="text-gray-600">
                  AI-powered crew recommendations based on your production type, budget tier, and shooting requirements.
                  Get optimized crew lists in seconds instead of hours.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-3">The Old Way vs. The New Way</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-red-700 mb-2">Movie Magic Budgeting (Old)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>- Manually add each crew position one by one</li>
                      <li>- Look up union rates in separate PDFs</li>
                      <li>- Guess at prep/wrap schedules</li>
                      <li>- Hope you did not miss a key position</li>
                      <li>- Takes 2-4 hours per department</li>
                    </ul>
                  </div>
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-green-700 mb-2">Smart Crew Builder (New)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>+ AI recommends complete crew list</li>
                      <li>+ Union rates auto-populated</li>
                      <li>+ Prep/wrap schedules calculated</li>
                      <li>+ Never miss critical positions</li>
                      <li>+ Complete crew in under 5 minutes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-3">
                  <li>
                    <strong>Navigate to Crew Builder</strong>
                    <p className="ml-6 text-sm">From your production, click "Crew Builder" in the sidebar</p>
                  </li>
                  <li>
                    <strong>Select Production Configuration</strong>
                    <p className="ml-6 text-sm">Choose from: Feature Film (Low/Mid/High Budget), TV Series, Documentary, or Commercial</p>
                  </li>
                  <li>
                    <strong>Enter Shooting Parameters</strong>
                    <p className="ml-6 text-sm">Shoot days, prep weeks, wrap days, location (affects union rates)</p>
                  </li>
                  <li>
                    <strong>Review AI Recommendations</strong>
                    <p className="ml-6 text-sm">See recommended positions with rates, quantities, and total costs</p>
                  </li>
                  <li>
                    <strong>Customize and Apply</strong>
                    <p className="ml-6 text-sm">Adjust any positions, then apply to your budget with one click</p>
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Production Configurations</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { name: 'Feature - Low Budget', budget: 'Under $5M', crew: '25-40 positions' },
                    { name: 'Feature - Mid Budget', budget: '$5M-$15M', crew: '50-70 positions' },
                    { name: 'Feature - High Budget', budget: '$15M+', crew: '80-120 positions' },
                    { name: 'TV Series - Episodic', budget: 'Per episode', crew: '40-60 positions' },
                    { name: 'Documentary', budget: 'Variable', crew: '10-20 positions' },
                    { name: 'Commercial', budget: 'Per day', crew: '15-30 positions' },
                  ].map((config) => (
                    <div key={config.name} className="border rounded p-3">
                      <div className="font-medium">{config.name}</div>
                      <div className="text-sm text-gray-500">{config.budget} | {config.crew}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Crew Optimization</h3>
                <p className="text-gray-600 mb-4">
                  The AI can also optimize your existing crew list by analyzing:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Positions that could be combined (cost savings)</li>
                  <li>Missing critical roles that should be added</li>
                  <li>Schedule optimizations for prep/wrap periods</li>
                  <li>Union rate compliance verification</li>
                </ul>
              </div>
            </div>
          )}

          {/* What-If Analyzer - AI Enhancement */}
          {activeSection === 'what-if' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">What-If Analyzer</h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">AI-Powered</span>
                </div>
                <p className="text-gray-600">
                  Instantly model budget scenarios without touching your working budget. Compare different
                  approaches side-by-side with AI-powered impact analysis.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-3">The Old Way vs. The New Way</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-red-700 mb-2">Movie Magic Budgeting (Old)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>- Create duplicate budget files</li>
                      <li>- Manually change values in each copy</li>
                      <li>- Export separate reports to compare</li>
                      <li>- No way to see ripple effects</li>
                      <li>- Easy to lose track of versions</li>
                    </ul>
                  </div>
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-green-700 mb-2">What-If Analyzer (New)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>+ Create scenarios in seconds</li>
                      <li>+ AI calculates all ripple effects</li>
                      <li>+ Side-by-side comparison view</li>
                      <li>+ See impact on fringes, overhead, etc.</li>
                      <li>+ Apply winning scenario with one click</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-3">
                  <li>
                    <strong>Open What-If Analyzer</strong>
                    <p className="ml-6 text-sm">From your production, click "What-If" in the sidebar</p>
                  </li>
                  <li>
                    <strong>Create a Scenario</strong>
                    <p className="ml-6 text-sm">Describe what you want to change: "Add 5 shoot days" or "Reduce camera crew by 20%"</p>
                  </li>
                  <li>
                    <strong>Review AI Analysis</strong>
                    <p className="ml-6 text-sm">See the total impact including all cascading effects (fringes, OT, etc.)</p>
                  </li>
                  <li>
                    <strong>Compare Scenarios</strong>
                    <p className="ml-6 text-sm">Create multiple scenarios and compare them side-by-side</p>
                  </li>
                  <li>
                    <strong>Apply or Discard</strong>
                    <p className="ml-6 text-sm">Apply the best scenario to your budget, or discard and try again</p>
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Scenarios</h3>
                <div className="space-y-3">
                  {[
                    { scenario: 'Add 5 shoot days', impact: '+$450,000 (includes OT, fringes, equipment)' },
                    { scenario: 'Move from LA to Atlanta', impact: '-$1.2M (labor savings + 30% tax credit)' },
                    { scenario: 'Cut prep week', impact: '-$180,000 (but flags risk of rushed start)' },
                    { scenario: 'Upgrade to 4K HDR', impact: '+$125,000 (post + equipment + DIT)' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{item.scenario}</span>
                      <span className={`text-sm ${item.impact.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}>
                        {item.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Variance Prediction</h3>
                <p className="text-gray-600 mb-4">
                  The What-If Analyzer includes historical variance predictions based on production type:
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-yellow-50 rounded p-3 text-center">
                    <div className="text-lg font-bold text-yellow-700">+8-12%</div>
                    <div className="text-xs text-yellow-800">Typical VFX Overrun</div>
                  </div>
                  <div className="bg-orange-50 rounded p-3 text-center">
                    <div className="text-lg font-bold text-orange-700">+5-10%</div>
                    <div className="text-xs text-orange-800">Location Cost Variance</div>
                  </div>
                  <div className="bg-red-50 rounded p-3 text-center">
                    <div className="text-lg font-bold text-red-700">+3-8%</div>
                    <div className="text-xs text-red-800">Schedule Overrun Risk</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Budget Guardian - AI Enhancement */}
          {activeSection === 'guardian' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Budget Guardian</h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">AI-Powered</span>
                </div>
                <p className="text-gray-600">
                  Comprehensive budget auditing with union compliance checking, tax incentive calculations,
                  and risk flagging. Your AI watchdog for budget accuracy.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-3">The Old Way vs. The New Way</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-red-700 mb-2">Movie Magic Budgeting (Old)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>- Manually check rates against union PDFs</li>
                      <li>- Calculate tax incentives by hand</li>
                      <li>- No automatic risk detection</li>
                      <li>- Easy to miss compliance issues</li>
                      <li>- Audit takes hours or days</li>
                    </ul>
                  </div>
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-green-700 mb-2">Budget Guardian (New)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>+ Automatic CBA rate verification</li>
                      <li>+ Tax incentive calculator built-in</li>
                      <li>+ AI flags potential risks</li>
                      <li>+ Compliance score at a glance</li>
                      <li>+ Full audit in under 30 seconds</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-3">
                  <li>
                    <strong>Open Budget Guardian</strong>
                    <p className="ml-6 text-sm">From your production, click "Guardian" in the sidebar</p>
                  </li>
                  <li>
                    <strong>Run Full Audit</strong>
                    <p className="ml-6 text-sm">Click "Run Audit" to analyze your entire budget</p>
                  </li>
                  <li>
                    <strong>Review Findings</strong>
                    <p className="ml-6 text-sm">See compliance score, rate violations, and risk flags</p>
                  </li>
                  <li>
                    <strong>Calculate Tax Incentives</strong>
                    <p className="ml-6 text-sm">Select your shooting location to see estimated credits</p>
                  </li>
                  <li>
                    <strong>Export Audit Report</strong>
                    <p className="ml-6 text-sm">Generate PDF report for stakeholders and financiers</p>
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What Gets Audited</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-blue-700">Union Compliance</h4>
                    <p className="text-sm text-gray-600">
                      Every rate checked against CBA minimums for IATSE, DGA, SAG-AFTRA, WGA, and Teamsters
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-green-700">Tax Incentives</h4>
                    <p className="text-sm text-gray-600">
                      Automatic calculation of qualified spend and estimated credits by location
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-medium text-yellow-700">Risk Factors</h4>
                    <p className="text-sm text-gray-600">
                      AI flags items with high variance risk based on historical data
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-purple-700">Missing Items</h4>
                    <p className="text-sm text-gray-600">
                      Identifies commonly forgotten line items and required positions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Incentive Programs</h3>
                <p className="text-gray-600 mb-4">Built-in calculator for major programs:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Georgia (30%)', 'New Mexico (35%)', 'California (25%)', 'New York (35%)',
                    'Louisiana (40%)', 'UK (45%)', 'Canada (25-45%)', 'Australia (40%)'].map((loc) => (
                    <div key={loc} className="bg-green-50 text-green-800 rounded p-2 text-sm text-center">
                      {loc}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nested Line Items - Modern Feature */}
          {activeSection === 'nested-items' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Nested Line Items</h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">Modern Feature</span>
                </div>
                <p className="text-gray-600">
                  Break down complex line items into visible sub-components. See exactly how totals
                  are calculated with the interactive Calculation Panel.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">The Old Way vs. The New Way</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-red-700 mb-2">MMB "4th Level" (Old)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>- Hidden detail level, hard to access</li>
                      <li>- Opens in separate modal/spreadsheet</li>
                      <li>- Easy to forget details exist</li>
                      <li>- No visual hierarchy in main view</li>
                      <li>- Confusing for new users</li>
                    </ul>
                  </div>
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-green-700 mb-2">Nested Line Items (New)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>+ Visible tree structure with expand/collapse</li>
                      <li>+ Click any row to see calculation panel</li>
                      <li>+ Add sub-items directly inline</li>
                      <li>+ Clear visual hierarchy</li>
                      <li>+ Intuitive for all users</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-3">
                  <li>
                    <strong>Click Any Line Item</strong>
                    <p className="ml-6 text-sm">In the budget editor, click any row to select it</p>
                  </li>
                  <li>
                    <strong>View Calculation Panel</strong>
                    <p className="ml-6 text-sm">The right sidebar shows the calculation breakdown</p>
                  </li>
                  <li>
                    <strong>Add Sub-Items</strong>
                    <p className="ml-6 text-sm">Click "Add Sub-Item" to break down the line item further</p>
                  </li>
                  <li>
                    <strong>Expand/Collapse</strong>
                    <p className="ml-6 text-sm">Use the arrow icons to show/hide nested items</p>
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Example: Breaking Down a Position</h3>
                <div className="bg-gray-50 rounded p-4 font-mono text-sm">
                  <div className="text-blue-600">510 - Unit Production Manager ... $108,000</div>
                  <div className="text-gray-600 ml-4">├─ Prep (4 weeks @ $4,500/wk) ... $18,000</div>
                  <div className="text-gray-600 ml-4">├─ Shoot (12 weeks @ $5,000/wk) ... $60,000</div>
                  <div className="text-gray-600 ml-4">├─ Wrap (2 weeks @ $4,500/wk) ... $9,000</div>
                  <div className="text-gray-600 ml-4">└─ Kit Rental (18 weeks @ $500/wk) ... $9,000</div>
                  <div className="text-gray-400 ml-4 mt-2">+ Fringes (25%) ... $21,000</div>
                  <div className="text-green-600 mt-2 font-bold">Total with Fringes: $129,000</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Panel Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>- <strong>Sub-Items List:</strong> See all components that make up the total</li>
                  <li>- <strong>Quick Calculator:</strong> Day rate to weekly, hourly to flat conversions</li>
                  <li>- <strong>Formula View:</strong> See exactly how the total is calculated</li>
                  <li>- <strong>Add Child:</strong> Create new sub-items without leaving the view</li>
                  <li>- <strong>Notes:</strong> Add context and justification for the line item</li>
                </ul>
              </div>
            </div>
          )}

          {/* Dynamic Budget Views - Modern Feature */}
          {activeSection === 'dynamic-views' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Dynamic Budget Views</h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">Modern Feature</span>
                </div>
                <p className="text-gray-600">
                  Instantly filter and view your budget from any angle. No more creating separate
                  "sub-budgets" - just switch views with one click.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">The Old Way vs. The New Way</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-red-700 mb-2">MMB Sub-Budgets (Old)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>- Create separate file for each view</li>
                      <li>- Manually maintain sync between files</li>
                      <li>- Changes do not flow between views</li>
                      <li>- Version control nightmare</li>
                      <li>- Limited to pre-defined groupings</li>
                    </ul>
                  </div>
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-green-700 mb-2">Dynamic Views (New)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>+ Single source of truth</li>
                      <li>+ Real-time filtering</li>
                      <li>+ Any combination of filters</li>
                      <li>+ Save custom views for reuse</li>
                      <li>+ Changes reflect everywhere instantly</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-3">
                  <li>
                    <strong>Open Views</strong>
                    <p className="ml-6 text-sm">From your production, click "Views" in the sidebar</p>
                  </li>
                  <li>
                    <strong>Select a Preset View</strong>
                    <p className="ml-6 text-sm">Choose from ATL Only, BTL Only, Labor Only, Post Production, etc.</p>
                  </li>
                  <li>
                    <strong>Or Create Custom Filters</strong>
                    <p className="ml-6 text-sm">Filter by department, union status, category range, or search term</p>
                  </li>
                  <li>
                    <strong>Save Your View</strong>
                    <p className="ml-6 text-sm">Click "Save View" to reuse this filter combination later</p>
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preset Views</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { name: 'Above the Line', desc: 'Categories 100-400 (Story, Talent, Direction, Producing)' },
                    { name: 'Below the Line', desc: 'Categories 500-900 (Crew, Equipment, Post)' },
                    { name: 'Labor Only', desc: 'All crew and talent costs (excludes equipment/materials)' },
                    { name: 'Post Production', desc: 'Categories 800+ (Editorial, VFX, Sound, Music)' },
                    { name: 'Union Positions', desc: 'Only positions flagged as union' },
                    { name: 'Non-Union', desc: 'Non-union positions and general expenses' },
                    { name: 'Physical Production', desc: 'Categories 500-700 (on-set crew and equipment)' },
                    { name: 'All Items', desc: 'Complete budget with no filters' },
                  ].map((view) => (
                    <div key={view.name} className="border rounded p-3">
                      <div className="font-medium">{view.name}</div>
                      <div className="text-sm text-gray-500">{view.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">View Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>- <strong>Summary Cards:</strong> See totals for your current view at a glance</li>
                  <li>- <strong>Department Breakdown:</strong> Visual chart showing costs by department</li>
                  <li>- <strong>Export View:</strong> Export just the filtered items to PDF</li>
                  <li>- <strong>Share View:</strong> Share a specific view with stakeholders</li>
                </ul>
              </div>
            </div>
          )}

          {/* Access Control - Modern Feature */}
          {activeSection === 'access-control' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Access & Sharing</h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">Modern Feature</span>
                </div>
                <p className="text-gray-600">
                  Role-based access control with secure share links. Grant the right permissions
                  to the right people without sharing passwords.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">The Old Way vs. The New Way</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-red-700 mb-2">MMB Password Protection (Old)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>- Single password for entire file</li>
                      <li>- All or nothing access</li>
                      <li>- Passwords shared via email/text</li>
                      <li>- No way to revoke individual access</li>
                      <li>- No audit trail of who viewed what</li>
                    </ul>
                  </div>
                  <div className="bg-white/70 rounded p-4">
                    <h4 className="font-medium text-green-700 mb-2">Role-Based Access (New)</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>+ Owner, Editor, Viewer, Commenter roles</li>
                      <li>+ Granular permissions per person</li>
                      <li>+ Secure token-based share links</li>
                      <li>+ Revoke access with one click</li>
                      <li>+ Full activity log of all access</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-3">
                  <li>
                    <strong>Open Access & Sharing</strong>
                    <p className="ml-6 text-sm">From your production, click "Access" in the sidebar</p>
                  </li>
                  <li>
                    <strong>Invite Team Members</strong>
                    <p className="ml-6 text-sm">Enter email addresses and select their role (Owner, Editor, Viewer, Commenter)</p>
                  </li>
                  <li>
                    <strong>Or Create a Share Link</strong>
                    <p className="ml-6 text-sm">Generate a link with specific permissions, optional expiration, and use limits</p>
                  </li>
                  <li>
                    <strong>Monitor Access</strong>
                    <p className="ml-6 text-sm">View the activity log to see who accessed the budget and when</p>
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border">Permission</th>
                      <th className="text-center p-3 border">Owner</th>
                      <th className="text-center p-3 border">Editor</th>
                      <th className="text-center p-3 border">Viewer</th>
                      <th className="text-center p-3 border">Commenter</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-3 border">View budget</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-green-600">Yes</td></tr>
                    <tr><td className="p-3 border">Add comments</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-red-600">No</td><td className="text-center p-3 border text-green-600">Yes</td></tr>
                    <tr><td className="p-3 border">Edit line items</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-red-600">No</td><td className="text-center p-3 border text-red-600">No</td></tr>
                    <tr><td className="p-3 border">Delete budget</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-red-600">No</td><td className="text-center p-3 border text-red-600">No</td><td className="text-center p-3 border text-red-600">No</td></tr>
                    <tr><td className="p-3 border">Manage access</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-red-600">No</td><td className="text-center p-3 border text-red-600">No</td><td className="text-center p-3 border text-red-600">No</td></tr>
                    <tr><td className="p-3 border">Create share links</td><td className="text-center p-3 border text-green-600">Yes</td><td className="text-center p-3 border text-red-600">No</td><td className="text-center p-3 border text-red-600">No</td><td className="text-center p-3 border text-red-600">No</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Link Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <span className="text-2xl">🔗</span>
                    <div>
                      <div className="font-medium">Permission Level</div>
                      <div className="text-sm text-gray-600">Choose what role the link grants (Viewer, Commenter, etc.)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <div className="font-medium">Expiration</div>
                      <div className="text-sm text-gray-600">Set link to expire after 24 hours, 7 days, 30 days, or never</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <span className="text-2xl">🔢</span>
                    <div>
                      <div className="font-medium">Use Limit</div>
                      <div className="text-sm text-gray-600">Limit link to 1, 5, 10, or unlimited uses</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Future Features / Roadmap */}
          {activeSection === 'future' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Roadmap</h2>
                <p className="text-gray-600">
                  Upcoming features planned for AI Budget System. Check back for updates.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
                <div className="space-y-4">
                  {[
                    {
                      key: 'actuals',
                      name: 'Actuals Tracking',
                      desc: 'Track actual spend vs budget in real-time. Essential for production accounting.',
                      priority: 'High'
                    },
                    {
                      key: 'excel-import',
                      name: 'Excel Import/Export',
                      desc: 'Import existing budgets from Excel. Export for stakeholders who prefer spreadsheets.',
                      priority: 'High'
                    },
                    {
                      key: 'cost-reports',
                      name: 'Cost Reports',
                      desc: 'Weekly and daily cost reports for studio/financier distribution.',
                      priority: 'High'
                    },
                    {
                      key: 'versions',
                      name: 'Multiple Budget Versions',
                      desc: 'Track Board, Working, and Locked budget versions side by side.',
                      priority: 'Medium'
                    },
                    {
                      key: 'amortization',
                      name: 'Amortization',
                      desc: 'Spread costs across episodes/seasons for TV productions.',
                      priority: 'Medium'
                    },
                    {
                      key: 'user-roles',
                      name: 'User Roles & Permissions',
                      desc: 'Line Producer, UPM, Production Accountant role-based access.',
                      priority: 'Medium'
                    },
                    {
                      key: 'hot-costs',
                      name: 'Hot Costs / PO Tracking',
                      desc: 'Real-time purchase order and commitment tracking.',
                      priority: 'Medium'
                    },
                    {
                      key: 'payroll-integration',
                      name: 'Payroll Integration',
                      desc: 'Connect with Cast & Crew, Entertainment Partners for automatic actuals.',
                      priority: 'Low'
                    },
                    {
                      key: 'mobile',
                      name: 'Mobile-Responsive UI',
                      desc: 'Full mobile support for on-set budget access.',
                      priority: 'Low'
                    },
                    {
                      key: 'audit-trail',
                      name: 'Audit Trail',
                      desc: 'Complete history of all budget changes with timestamps and users.',
                      priority: 'Low'
                    },
                    {
                      key: 'dashboard',
                      name: 'Analytics Dashboard',
                      desc: 'Production overview with charts, graphs, and KPIs.',
                      priority: 'Low'
                    },
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-start gap-4 p-4 border rounded-lg">
                      <input type="checkbox" disabled className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feature.name}</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            feature.priority === 'High' ? 'bg-red-100 text-red-800' :
                            feature.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {feature.priority} Priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Requests</h3>
                <p className="text-gray-600 text-sm">
                  Have a feature request? Contact us with your suggestions for improving AI Budget System.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
