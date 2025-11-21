'use client'

import { useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

interface CrewMember {
  id: string
  position: string
  rate: number
  rateType: 'hourly' | 'daily' | 'weekly'
  quantity: number
  weeks: number
  union: string
  subtotal: number
}

interface RateLookupResult {
  job_classification: string
  union_local: string
  base_rate: string
  rate_type: string
  location: string
}

interface SavedBudget {
  id: string
  name: string
  description: string
  production_weeks: number
  fringe_rate: string
  crew_count: number
  total_labor: string
  grand_total: string
  updated_at: string
}

interface CrewTemplate {
  id: number
  name: string
  description: string
  category: string
  production_type: string
  crew_data: Array<{
    position: string
    union: string
    quantity: number
    weeks: number
    rateType: string
  }>
}

export default function BudgetCalculator() {
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<RateLookupResult[]>([])
  const [loading, setLoading] = useState(false)
  const [fringeRate, setFringeRate] = useState(30)
  const [productionWeeks, setProductionWeeks] = useState(12)
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [budgetName, setBudgetName] = useState('')
  const [budgetDescription, setBudgetDescription] = useState('')
  const [currentBudgetId, setCurrentBudgetId] = useState<string | null>(null)
  const [crewTemplates, setCrewTemplates] = useState<CrewTemplate[]>([])
  const [templateCategories, setTemplateCategories] = useState<string[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const searchRates = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/rate-cards/smart-lookup`, {
        params: { query: searchTerm }
      })
      setSearchResults(response.data.data || [])
    } catch (error) {
      console.error('Error searching rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const addCrewMember = (result: RateLookupResult) => {
    const newMember: CrewMember = {
      id: crypto.randomUUID(),
      position: result.job_classification,
      rate: parseFloat(result.base_rate),
      rateType: result.rate_type as 'hourly' | 'daily' | 'weekly',
      quantity: 1,
      weeks: productionWeeks,
      union: result.union_local,
      subtotal: 0
    }
    newMember.subtotal = calculateSubtotal(newMember)
    setCrew([...crew, newMember])
    setSearchTerm('')
    setSearchResults([])
  }

  const calculateSubtotal = (member: CrewMember): number => {
    switch (member.rateType) {
      case 'hourly':
        return member.rate * 10 * 5 * member.weeks * member.quantity // 10hr days, 5 days/week
      case 'daily':
        return member.rate * 5 * member.weeks * member.quantity // 5 days/week
      case 'weekly':
        return member.rate * member.weeks * member.quantity
      default:
        return member.rate * member.quantity
    }
  }

  const updateCrewMember = (id: string, field: keyof CrewMember, value: number | string) => {
    setCrew(crew.map(member => {
      if (member.id === id) {
        const updated = { ...member, [field]: value }
        updated.subtotal = calculateSubtotal(updated)
        return updated
      }
      return member
    }))
  }

  const removeCrewMember = (id: string) => {
    setCrew(crew.filter(m => m.id !== id))
  }

  const totalLabor = crew.reduce((sum, m) => sum + m.subtotal, 0)
  const totalFringes = totalLabor * (fringeRate / 100)
  const grandTotal = totalLabor + totalFringes

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const exportToExcel = () => {
    type ExportRow = {
      Position: string
      Union: string
      Rate: number | string
      'Rate Type': string
      Quantity: number | string
      Weeks: number | string
      Subtotal: number
    }

    const data: ExportRow[] = crew.map(m => ({
      Position: m.position,
      Union: m.union,
      Rate: m.rate,
      'Rate Type': m.rateType,
      Quantity: m.quantity,
      Weeks: m.weeks,
      Subtotal: m.subtotal
    }))

    data.push({
      Position: '',
      Union: '',
      Rate: '',
      'Rate Type': '',
      Quantity: '',
      Weeks: '',
      Subtotal: 0
    })
    data.push({
      Position: 'Labor Subtotal',
      Union: '',
      Rate: '',
      'Rate Type': '',
      Quantity: '',
      Weeks: '',
      Subtotal: totalLabor
    })
    data.push({
      Position: `Fringes (${fringeRate}%)`,
      Union: '',
      Rate: '',
      'Rate Type': '',
      Quantity: '',
      Weeks: '',
      Subtotal: totalFringes
    })
    data.push({
      Position: 'GRAND TOTAL',
      Union: '',
      Rate: '',
      'Rate Type': '',
      Quantity: '',
      Weeks: '',
      Subtotal: grandTotal
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Crew Budget')

    ws['!cols'] = [
      { wch: 30 }, // Position
      { wch: 20 }, // Union
      { wch: 12 }, // Rate
      { wch: 10 }, // Rate Type
      { wch: 8 },  // Quantity
      { wch: 8 },  // Weeks
      { wch: 15 }  // Subtotal
    ]

    XLSX.writeFile(wb, `crew_budget_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('Crew Budget Report', 14, 22)

    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)
    doc.text(`Production Weeks: ${productionWeeks}`, 14, 36)
    doc.text(`Fringe Rate: ${fringeRate}%`, 14, 42)

    const tableData = crew.map(m => [
      m.position,
      m.union,
      formatCurrency(m.rate),
      m.rateType,
      m.quantity.toString(),
      m.weeks.toString(),
      formatCurrency(m.subtotal)
    ])

    autoTable(doc, {
      head: [['Position', 'Union', 'Rate', 'Type', 'Qty', 'Weeks', 'Subtotal']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })

    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    doc.setFontSize(11)
    doc.text(`Labor Subtotal: ${formatCurrency(totalLabor)}`, 14, finalY)
    doc.text(`Fringes (${fringeRate}%): ${formatCurrency(totalFringes)}`, 14, finalY + 7)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Grand Total: ${formatCurrency(grandTotal)}`, 14, finalY + 17)

    doc.save(`crew_budget_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const loadSavedBudgets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/saved-budgets`)
      setSavedBudgets(response.data.data || [])
    } catch (error) {
      console.error('Error loading saved budgets:', error)
    }
  }

  const saveBudget = async () => {
    if (!budgetName.trim() || crew.length === 0) return

    try {
      const payload = {
        name: budgetName,
        description: budgetDescription,
        production_weeks: productionWeeks,
        fringe_rate: fringeRate,
        crew_data: crew,
        total_labor: totalLabor,
        total_fringes: totalFringes,
        grand_total: grandTotal
      }

      if (currentBudgetId) {
        await axios.put(`${API_URL}/api/saved-budgets/${currentBudgetId}`, payload)
      } else {
        const response = await axios.post(`${API_URL}/api/saved-budgets`, payload)
        setCurrentBudgetId(response.data.data.id)
      }

      setShowSaveModal(false)
      alert('Budget saved successfully!')
    } catch (error) {
      console.error('Error saving budget:', error)
      alert('Failed to save budget')
    }
  }

  const loadBudget = async (budgetId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/saved-budgets/${budgetId}`)
      const budget = response.data.data

      setCrew(budget.crew_data)
      setProductionWeeks(budget.production_weeks)
      setFringeRate(parseFloat(budget.fringe_rate))
      setBudgetName(budget.name)
      setBudgetDescription(budget.description || '')
      setCurrentBudgetId(budget.id)
      setShowLoadModal(false)
    } catch (error) {
      console.error('Error loading budget:', error)
      alert('Failed to load budget')
    }
  }

  const deleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      await axios.delete(`${API_URL}/api/saved-budgets/${budgetId}`)
      loadSavedBudgets()
      if (currentBudgetId === budgetId) {
        setCurrentBudgetId(null)
        setBudgetName('')
        setBudgetDescription('')
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const newBudget = () => {
    setCrew([])
    setCurrentBudgetId(null)
    setBudgetName('')
    setBudgetDescription('')
    setProductionWeeks(12)
    setFringeRate(30)
  }

  const suggestFringes = async () => {
    if (crew.length === 0) return

    // Get the most common union from crew
    const unionCounts: Record<string, number> = {}
    crew.forEach(m => {
      unionCounts[m.union] = (unionCounts[m.union] || 0) + 1
    })
    const primaryUnion = Object.entries(unionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0]

    if (!primaryUnion) return

    try {
      const response = await axios.get(`${API_URL}/api/fringes/suggest`, {
        params: { union_local: primaryUnion }
      })
      if (response.data.success) {
        setFringeRate(response.data.suggested_rate)
        alert(`Fringe rate set to ${response.data.suggested_rate}% based on ${response.data.union_local} rates.\n\n${response.data.note}`)
      }
    } catch (error) {
      console.error('Error fetching suggested fringes:', error)
    }
  }

  const loadCrewTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/crew-templates`)
      if (response.data.success) {
        setCrewTemplates(response.data.data)
        setTemplateCategories(response.data.categories || [])
      }
    } catch (error) {
      console.error('Error loading crew templates:', error)
    }
  }

  const applyTemplate = async (template: CrewTemplate) => {
    setLoading(true)
    try {
      const newCrewMembers: CrewMember[] = []

      for (const pos of template.crew_data) {
        // Look up the rate for each position
        try {
          const rateResponse = await axios.get(`${API_URL}/api/rate-cards/smart-lookup`, {
            params: { query: pos.position }
          })

          if (rateResponse.data.data && rateResponse.data.data.length > 0) {
            const rateData = rateResponse.data.data[0]
            newCrewMembers.push({
              id: crypto.randomUUID(),
              position: rateData.job_classification,
              rate: parseFloat(rateData.base_rate),
              rateType: rateData.rate_type as 'hourly' | 'daily' | 'weekly',
              quantity: pos.quantity,
              weeks: pos.weeks,
              union: rateData.union_local,
              subtotal: 0
            })
          } else {
            // No rate found, add with placeholder
            newCrewMembers.push({
              id: crypto.randomUUID(),
              position: pos.position,
              rate: 0,
              rateType: (pos.rateType || 'weekly') as 'hourly' | 'daily' | 'weekly',
              quantity: pos.quantity,
              weeks: pos.weeks,
              union: pos.union,
              subtotal: 0
            })
          }
        } catch {
          // Add without rate lookup on error
          newCrewMembers.push({
            id: crypto.randomUUID(),
            position: pos.position,
            rate: 0,
            rateType: (pos.rateType || 'weekly') as 'hourly' | 'daily' | 'weekly',
            quantity: pos.quantity,
            weeks: pos.weeks,
            union: pos.union,
            subtotal: 0
          })
        }
      }

      // Calculate subtotals
      const updatedCrew = newCrewMembers.map(m => ({
        ...m,
        subtotal: calculateSubtotal(m)
      }))

      setCrew([...crew, ...updatedCrew])
      setShowTemplateModal(false)
      alert(`Added ${updatedCrew.length} positions from "${template.name}" template`)
    } catch (error) {
      console.error('Error applying template:', error)
      alert('Failed to apply template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Crew Budget Calculator
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {currentBudgetId ? `Editing: ${budgetName}` : 'Build a crew budget using union rates'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={newBudget}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
          >
            New
          </button>
          <button
            onClick={() => { loadCrewTemplates(); setShowTemplateModal(true) }}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            Templates
          </button>
          <button
            onClick={() => { loadSavedBudgets(); setShowLoadModal(true) }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Load
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={crew.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Production Settings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Production Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Production Weeks
            </label>
            <input
              type="number"
              value={productionWeeks}
              onChange={(e) => setProductionWeeks(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fringe Rate (%)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={fringeRate}
                onChange={(e) => setFringeRate(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={suggestFringes}
                disabled={crew.length === 0}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm disabled:opacity-50 whitespace-nowrap"
                title="Auto-suggest based on union rates"
              >
                Auto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Crew Member */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Add Crew Position</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search position (e.g., Gaffer, DP, Key Grip...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchRates()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={searchRates}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 border rounded-md divide-y dark:border-gray-700 dark:divide-gray-700">
            {searchResults.slice(0, 10).map((result, idx) => (
              <div
                key={idx}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                onClick={() => addCrewMember(result)}
              >
                <div>
                  <div className="font-medium">{result.job_classification}</div>
                  <div className="text-sm text-gray-500">{result.union_local} - {result.location}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{formatCurrency(parseFloat(result.base_rate))}</div>
                  <div className="text-sm text-gray-500">/{result.rate_type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crew List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Crew List ({crew.length})</h2>

        {crew.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No crew members added. Search for positions above to add them.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Union</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Weeks</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {crew.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-2 font-medium">{member.position}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{member.union}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={member.rate}
                        onChange={(e) => updateCrewMember(member.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-2 text-sm">{member.rateType}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={member.quantity}
                        onChange={(e) => updateCrewMember(member.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={member.weeks}
                        onChange={(e) => updateCrewMember(member.id, 'weeks', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-green-600">
                      {formatCurrency(member.subtotal)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeCrewMember(member.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals */}
      {crew.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Budget Summary</h2>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Excel
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                PDF
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>Labor Subtotal:</span>
              <span className="font-semibold">{formatCurrency(totalLabor)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Fringes ({fringeRate}%):</span>
              <span className="font-semibold">{formatCurrency(totalFringes)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-xl font-bold">
              <span>Grand Total:</span>
              <span className="text-green-600">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Save Budget</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Budget Name *</label>
                <input
                  type="text"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g., Feature Film - Camera Dept"
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={budgetDescription}
                  onChange={(e) => setBudgetDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={saveBudget}
                disabled={!budgetName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
              >
                {currentBudgetId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Load Saved Budget</h3>
            {savedBudgets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No saved budgets found</p>
            ) : (
              <div className="space-y-2">
                {savedBudgets.map((budget) => (
                  <div
                    key={budget.id}
                    className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="cursor-pointer flex-1" onClick={() => loadBudget(budget.id)}>
                      <div className="font-medium">{budget.name}</div>
                      <div className="text-sm text-gray-500">
                        {budget.crew_count} positions | {formatCurrency(parseFloat(budget.grand_total || '0'))} total
                      </div>
                      <div className="text-xs text-gray-400">
                        Updated: {new Date(budget.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBudget(budget.id) }}
                      className="ml-2 px-3 py-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Crew from Template</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select a template to quickly add crew positions with union rates
            </p>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Filter by Department</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Departments</option>
                {templateCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Template List */}
            {crewTemplates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Loading templates...</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {crewTemplates
                  .filter(t => !selectedCategory || t.category === selectedCategory)
                  .map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {template.crew_data.length} positions | {template.category} | {template.production_type}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {template.category}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Positions: {template.crew_data.map(c => c.position).slice(0, 4).join(', ')}
                      {template.crew_data.length > 4 && ` +${template.crew_data.length - 4} more`}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
