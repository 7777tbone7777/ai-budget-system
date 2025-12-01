// NEW SECTIONS TO ADD TO /frontend/app/guide/page.tsx
// Insert after the AI Generator section (around line 540) and before Crew Builder section

// ========================================
// CHART OF ACCOUNTS SECTION
// ========================================
{activeSection === 'chart-of-accounts' && (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-4">📋 Chart of Accounts</h2>
      <p className="text-gray-600 dark:text-gray-300">
        Professional industry-standard account code structures compatible with Movie Magic Budgeting, EP Budgeting, and other professional tools.
      </p>
    </div>

    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
        Why Chart of Accounts Matters
      </h3>
      <p className="text-sm text-blue-800 dark:text-blue-200">
        Professional budgets require industry-standard account code structures. Our COA system ensures your budgets are compatible with studio systems and can be easily imported into tools like Movie Magic Budgeting.
      </p>
    </div>

    <div>
      <h3 className="text-xl font-semibold mb-3">Available COA Templates</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎬</span>
            <h4 className="font-semibold">Standard Film/TV</h4>
            <StatusBadge featureKey="chart-of-accounts" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Default Movie Magic structure with 32 budget categories
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Covers theatrical, TV series, limited series</li>
            <li>• Account codes: 10-98 (Story & Rights through Contingency)</li>
            <li>• Most widely used in the industry</li>
          </ul>
        </div>

        <div className="border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📺</span>
            <h4 className="font-semibold">AICP (Commercials)</h4>
            <StatusBadge featureKey="chart-of-accounts" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Optimized for advertising and commercial production
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• 14 simplified categories</li>
            <li>• Shorter production schedules</li>
            <li>• Account codes: 10-65</li>
          </ul>
        </div>

        <div className="border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎞️</span>
            <h4 className="font-semibold">Netflix Production</h4>
            <StatusBadge featureKey="chart-of-accounts" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Studio-specific structure for Netflix originals
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Aligned with Netflix requirements</li>
            <li>• Enhanced post-production categories</li>
            <li>• Distribution cost tracking</li>
          </ul>
        </div>

        <div className="border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏰</span>
            <h4 className="font-semibold">Disney Production</h4>
            <StatusBadge featureKey="chart-of-accounts" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Studio-specific structure for Disney projects
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Disney budgeting standards</li>
            <li>• Family/franchise content categories</li>
            <li>• Enhanced marketing sections</li>
          </ul>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-semibold mb-3">Sequential Account Codes</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        All budget line items are assigned sequential account codes within their departments, ensuring professional organization and compatibility with industry tools.
      </p>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm mb-4">
        <div className="mb-2 font-semibold">Account Code Structure:</div>
        <div className="text-green-600 dark:text-green-400">[Category Code][Sequential Number]</div>
        <div className="mt-3 space-y-1">
          <div>2001 - Unit Production Manager</div>
          <div>2002 - Line Producer</div>
          <div>2003 - First Assistant Director</div>
          <div className="text-gray-400">...</div>
          <div>3301 - Director of Photography</div>
          <div>3302 - Camera Operator</div>
          <div>3303 - First AC</div>
        </div>
      </div>

      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="p-3 text-left border-b dark:border-gray-700">Code</th>
              <th className="p-3 text-left border-b dark:border-gray-700">Category</th>
              <th className="p-3 text-left border-b dark:border-gray-700">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-3 border-b dark:border-gray-700">10xx</td><td className="p-3 border-b dark:border-gray-700">Story & Rights</td><td className="p-3 border-b dark:border-gray-700">Above the Line</td></tr>
            <tr><td className="p-3 border-b dark:border-gray-700">11xx</td><td className="p-3 border-b dark:border-gray-700">Producer</td><td className="p-3 border-b dark:border-gray-700">Above the Line</td></tr>
            <tr><td className="p-3 border-b dark:border-gray-700">12xx</td><td className="p-3 border-b dark:border-gray-700">Director</td><td className="p-3 border-b dark:border-gray-700">Above the Line</td></tr>
            <tr><td className="p-3 border-b dark:border-gray-700">13xx</td><td className="p-3 border-b dark:border-gray-700">Cast</td><td className="p-3 border-b dark:border-gray-700">Above the Line</td></tr>
            <tr><td className="p-3 border-b dark:border-gray-700">20xx</td><td className="p-3 border-b dark:border-gray-700">Production Staff</td><td className="p-3 border-b dark:border-gray-700">Below the Line</td></tr>
            <tr><td className="p-3 border-b dark:border-gray-700">22xx</td><td className="p-3 border-b dark:border-gray-700">Art Department</td><td className="p-3 border-b dark:border-gray-700">Below the Line</td></tr>
            <tr><td className="p-3 border-b dark:border-gray-700">33xx</td><td className="p-3 border-b dark:border-gray-700">Camera</td><td className="p-3 border-b dark:border-gray-700">Below the Line</td></tr>
            <tr><td className="p-3 border-b dark:border-gray-700">34xx</td><td className="p-3 border-b dark:border-gray-700">Production Sound</td><td className="p-3 border-b dark:border-gray-700">Below the Line</td></tr>
            <tr><td className="p-3 border-b dark:border-gray-700">40xx</td><td className="p-3 border-b dark:border-gray-700">Editorial</td><td className="p-3 border-b dark:border-gray-700">Post-Production</td></tr>
            <tr><td className="p-3">70xx</td><td className="p-3">Fringe Benefits</td><td className="p-3">Other</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-semibold mb-3">Benefits</h3>
      <ul className="space-y-2 text-gray-600 dark:text-gray-300">
        <li className="flex items-start gap-2">
          <span className="text-green-500 mt-1">✓</span>
          <span><strong>Professional Presentation:</strong> Industry-standard codes for studio submissions</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-500 mt-1">✓</span>
          <span><strong>Tool Compatibility:</strong> Import/export with Movie Magic, EP Budgeting</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-500 mt-1">✓</span>
          <span><strong>Easy Organization:</strong> Sequential codes within departments</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-500 mt-1">✓</span>
          <span><strong>Clear Grouping:</strong> Budget analysis by category and department</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-500 mt-1">✓</span>
          <span><strong>88+ Crew Templates:</strong> All theatrical positions have proper sequential codes</span>
        </li>
      </ul>
    </div>
  </div>
)}

// ========================================
// UNION AGREEMENTS SECTION
// ========================================
{activeSection === 'union-agreements' && (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-4">📜 Union Agreements</h2>
      <p className="text-gray-600 dark:text-gray-300">
        Intelligent union agreement recommendations and management based on production type, platform, budget, and location.
      </p>
    </div>

    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
        Smart Agreement Selection
      </h3>
      <p className="text-sm text-blue-800 dark:text-blue-200">
        The system automatically recommends appropriate union agreements based on your production parameters. Theatrical productions get theatrical agreements, TV shows get videotape agreements, and the system accounts for multi-year contract periods.
      </p>
    </div>

    <div>
      <h3 className="text-xl font-semibold mb-3">How It Works</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎬</span>
            <h4 className="font-semibold">Production Type</h4>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Theatrical → Theatrical agreements</li>
            <li>• TV → Videotape agreements</li>
            <li>• Commercials → AICP agreements</li>
          </ul>
        </div>

        <div className="border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📺</span>
            <h4 className="font-semibold">Distribution Platform</h4>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• High Budget SVOD → Full-scale</li>
            <li>• Network/Cable → Standard TV</li>
            <li>• Low Budget → Low-budget sideletters</li>
          </ul>
        </div>

        <div className="border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📅</span>
            <h4 className="font-semibold">Production Start Date</h4>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Determines contract year</li>
            <li>• DGA 2023-2026: Year 3 rates</li>
            <li>• IATSE 2024-2027: Year 2 rates</li>
          </ul>
        </div>

        <div className="border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span>
            <h4 className="font-semibold">Budget Range</h4>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Low budget → Sideletters</li>
            <li>• High budget → Full-scale</li>
            <li>• Custom negotiations supported</li>
          </ul>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-semibold mb-3">Union Rate Database</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Comprehensive database of 1,911+ union rate cards covering 34+ union locals.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="border dark:border-gray-700 rounded-lg p-3">
          <div className="text-2xl mb-1">🎥</div>
          <div className="font-semibold">IATSE Locals</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            44, 52, 80, 600, 695, 700, 705, 706, 728, 729, 800, 839, 871, 892, Videotape
          </div>
        </div>

        <div className="border dark:border-gray-700 rounded-lg p-3">
          <div className="text-2xl mb-1">📽️</div>
          <div className="font-semibold">Director & Actor Guilds</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            DGA, SAG-AFTRA, WGA, DGC
          </div>
        </div>

        <div className="border dark:border-gray-700 rounded-lg p-3">
          <div className="text-2xl mb-1">🚚</div>
          <div className="font-semibold">Transportation</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Teamsters Local 399
          </div>
        </div>
      </div>

      <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="text-sm font-semibold mb-2">Coverage Statistics:</div>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• 1,911 total rate cards in database</li>
          <li>• 441 rate cards effective 2025 and later</li>
          <li>• Multi-year agreements with annual increases</li>
          <li>• Effective date tracking for correct rate selection</li>
        </ul>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-semibold mb-3">Custom Sideletters</h3>
      <StatusBadge featureKey="union-agreements" />
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Full backend API support for production-specific negotiated agreements. UI implementation coming soon.
      </p>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
        <div className="flex items-start gap-2">
          <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚙️</span>
          <div>
            <div className="font-semibold text-yellow-900 dark:text-yellow-100">Backend Complete</div>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              The custom sideletter API is fully functional. 7 endpoints available for creating, updating, and managing production-specific union agreements. UI interface coming in next release.
            </div>
          </div>
        </div>
      </div>

      <div className="border dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Common Use Cases:</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <li>• <strong>Major Studio Deals:</strong> 101 Studios, Blumhouse multi-show agreements</li>
          <li>• <strong>Budget Adjustments:</strong> Negotiate -5% to -10% wage reductions</li>
          <li>• <strong>Custom Overtime:</strong> Modified daily OT, 6th/7th day rules</li>
          <li>• <strong>Location Provisions:</strong> Remote location allowances and rules</li>
        </ul>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-semibold mb-3">Example: High-Budget Netflix Series</h3>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm">
        <div className="mb-2 text-gray-500 dark:text-gray-400">// Production Parameters</div>
        <div>Production Type: Multi-camera sitcom</div>
        <div>Platform: High Budget SVOD (Netflix)</div>
        <div>Start Date: 2025-11-01</div>
        <div className="mt-3 mb-2 text-gray-500 dark:text-gray-400">// Recommended Agreements</div>
        <div className="text-green-600 dark:text-green-400">IATSE Videotape 2024-2027 (Year 2 rates)</div>
        <div className="text-green-600 dark:text-green-400">DGA Basic Agreement 2023-2026 (Year 3 rates)</div>
        <div className="text-green-600 dark:text-green-400">SAG-AFTRA Television Agreement 2023</div>
      </div>
    </div>
  </div>
)}
