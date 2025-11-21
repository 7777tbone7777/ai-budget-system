'use client'

import { useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app'

// Industry-standard account code structure
const ACCOUNT_CATEGORIES = {
  'ATL': {
    name: 'Above The Line',
    accounts: [
      { code: '1100', name: 'WRITER', department: 'Writing' },
      { code: '1200', name: 'PRODUCER', department: 'Production' },
      { code: '1300', name: 'DIRECTOR', department: 'Production' },
      { code: '1400', name: 'CAST', department: 'Cast' },
      { code: '1500', name: 'ATL TRAVEL & LIVING', department: 'Travel' },
    ]
  },
  'BTL-PRODUCTION': {
    name: 'Below The Line - Production',
    accounts: [
      { code: '2000', name: 'PRODUCTION STAFF', department: 'Production Office' },
      { code: '2100', name: 'EXTRA TALENT', department: 'Cast' },
      { code: '2200', name: 'ART DEPARTMENT', department: 'Art Department' },
      { code: '2300', name: 'SET CONSTRUCTION', department: 'Construction' },
      { code: '2400', name: 'SET STRIKING', department: 'Construction' },
      { code: '2500', name: 'SET OPERATIONS', department: 'Set Operations' },
      { code: '2600', name: 'SPECIAL EFFECTS', department: 'Special Effects' },
      { code: '2700', name: 'SET DRESSING', department: 'Set Decoration' },
      { code: '2800', name: 'PROPERTY', department: 'Props' },
      { code: '2900', name: 'WARDROBE', department: 'Costume' },
    ]
  },
  'BTL-CAMERA-SOUND': {
    name: 'Below The Line - Camera & Sound',
    accounts: [
      { code: '3000', name: 'MAKEUP & HAIR', department: 'Hair & Makeup' },
      { code: '3100', name: 'GRIP', department: 'Grip' },
      { code: '3200', name: 'LIGHTING', department: 'Electric' },
      { code: '3300', name: 'CAMERA', department: 'Camera' },
      { code: '3400', name: 'PRODUCTION SOUND', department: 'Sound' },
      { code: '3500', name: 'TRANSPORTATION', department: 'Transportation' },
      { code: '3600', name: 'LOCATION', department: 'Location' },
      { code: '3700', name: 'PRODUCTION FILM & LAB', department: 'Production' },
    ]
  },
  'POST': {
    name: 'Post Production',
    accounts: [
      { code: '4000', name: 'EDITORIAL', department: 'Post Production' },
      { code: '4100', name: 'MUSIC', department: 'Music' },
      { code: '4200', name: 'POST SOUND', department: 'Post Sound' },
      { code: '4300', name: 'POST FILM & LAB', department: 'Post Production' },
      { code: '4400', name: 'MAIN TITLES', department: 'Post Production' },
      { code: '4500', name: 'VFX', department: 'VFX' },
    ]
  },
  'OTHER': {
    name: 'Other',
    accounts: [
      { code: '6500', name: 'PUBLICITY', department: 'Publicity' },
      { code: '6600', name: 'GENERAL EXPENSE', department: 'General' },
      { code: '6700', name: 'INSURANCE', department: 'Insurance' },
      { code: '6800', name: 'FRINGE BENEFITS', department: 'Fringes' },
    ]
  }
}

// Union to account code mapping
const getAccountCode = (union: string, position: string): string => {
  const unionLower = union.toLowerCase()
  const posLower = position.toLowerCase()

  if (unionLower.includes('dga')) return '2000'
  if (unionLower.includes('600') || posLower.includes('camera') || posLower.includes('photographer') || posLower.includes('dit')) return '3300'
  if (unionLower.includes('728') || posLower.includes('gaffer') || posLower.includes('electric')) return '3200'
  if (unionLower.includes('80') || posLower.includes('grip')) return '3100'
  if (unionLower.includes('695') || posLower.includes('sound') || posLower.includes('boom')) return '3400'
  if (unionLower.includes('800') || posLower.includes('art director')) return '2200'
  if (unionLower.includes('44') || posLower.includes('decorator') || posLower.includes('prop')) return '2800'
  if (unionLower.includes('706') || posLower.includes('makeup') || posLower.includes('hair')) return '3000'
  if (unionLower.includes('705') || unionLower.includes('892') || posLower.includes('costume')) return '2900'
  if (unionLower.includes('700') || posLower.includes('editor')) return '4000'
  if (unionLower.includes('161') || posLower.includes('coordinator') || posLower.includes('secretary')) return '2000'
  if (unionLower.includes('399') || unionLower.includes('teamster')) {
    if (posLower.includes('location')) return '3600'
    return '3500'
  }
  if (unionLower.includes('sag') || posLower.includes('actor')) return '1400'
  if (unionLower.includes('wga') || posLower.includes('writer')) return '1100'

  return '2500'
}

// Get department from account code
const getDepartmentFromCode = (code: string): string => {
  for (const category of Object.values(ACCOUNT_CATEGORIES)) {
    const account = category.accounts.find(a => a.code === code)
    if (account) return account.department
  }
  return 'Other'
}

// Get account name from code
const getAccountName = (code: string): string => {
  for (const category of Object.values(ACCOUNT_CATEGORIES)) {
    const account = category.accounts.find(a => a.code === code)
    if (account) return account.name
  }
  return 'OTHER'
}

type UnitType = 'hourly' | 'daily' | 'weekly' | 'allow' | 'flat' | 'percent'

interface BudgetLineItem {
  id: string
  accountCode: string
  description: string
  position: string
  union: string
  quantity: number
  unit: UnitType
  rate: number
  multiplier: number  // hours per day, days per week, or percentage
  prepWeeks: number
  shootWeeks: number
  wrapWeeks: number
  subtotal: number
  itemType: 'labor' | 'equipment' | 'rental' | 'purchase' | 'allowance' | 'other'
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
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<RateLookupResult[]>([])
  const [loading, setLoading] = useState(false)
  const [fringeRate, setFringeRate] = useState(30)
  const [prepWeeks, setPrepWeeks] = useState(4)
  const [shootWeeks, setShootWeeks] = useState(8)
  const [wrapWeeks, setWrapWeeks] = useState(2)
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
  const [viewMode, setViewMode] = useState<'flat' | 'byAccount' | 'byDepartment'>('byAccount')
  const [collapsedAccounts, setCollapsedAccounts] = useState<Record<string, boolean>>({})
  const [showAddLineModal, setShowAddLineModal] = useState(false)
  const [newLineType, setNewLineType] = useState<'equipment' | 'rental' | 'purchase' | 'allowance'>('equipment')

  const totalProductionWeeks = prepWeeks + shootWeeks + wrapWeeks

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

  const calculateSubtotal = (item: BudgetLineItem): number => {
    const totalWeeks = item.prepWeeks + item.shootWeeks + item.wrapWeeks

    switch (item.unit) {
      case 'hourly':
        // hours per day × days per week × weeks × quantity × rate
        return item.rate * item.multiplier * 5 * totalWeeks * item.quantity
      case 'daily':
        // days per week × weeks × quantity × rate
        return item.rate * item.multiplier * totalWeeks * item.quantity
      case 'weekly':
        return item.rate * totalWeeks * item.quantity
      case 'allow':
      case 'flat':
        return item.rate * item.quantity
      case 'percent':
        // For percentage-based items (like insurance)
        return item.rate * (item.multiplier / 100)
      default:
        return item.rate * item.quantity
    }
  }

  const addCrewMember = (result: RateLookupResult) => {
    const accountCode = getAccountCode(result.union_local, result.job_classification)
    const unitType = result.rate_type as UnitType

    const newItem: BudgetLineItem = {
      id: crypto.randomUUID(),
      accountCode,
      description: getAccountName(accountCode),
      position: result.job_classification,
      union: result.union_local,
      quantity: 1,
      unit: unitType === 'hourly' ? 'hourly' : unitType === 'daily' ? 'daily' : 'weekly',
      rate: parseFloat(result.base_rate),
      multiplier: unitType === 'hourly' ? 10 : unitType === 'daily' ? 5 : 1,
      prepWeeks: Math.floor(prepWeeks * 0.5),  // Default to half prep
      shootWeeks: shootWeeks,
      wrapWeeks: Math.floor(wrapWeeks * 0.5),  // Default to half wrap
      subtotal: 0,
      itemType: 'labor'
    }
    newItem.subtotal = calculateSubtotal(newItem)
    setLineItems([...lineItems, newItem])
    setSearchTerm('')
    setSearchResults([])
  }

  const addNonLaborItem = (type: 'equipment' | 'rental' | 'purchase' | 'allowance', accountCode: string) => {
    const newItem: BudgetLineItem = {
      id: crypto.randomUUID(),
      accountCode,
      description: '',
      position: type === 'equipment' ? 'Equipment Package' :
                type === 'rental' ? 'Rental' :
                type === 'purchase' ? 'Purchase' : 'Allowance',
      union: '',
      quantity: 1,
      unit: type === 'purchase' ? 'allow' : type === 'allowance' ? 'allow' : 'weekly',
      rate: 0,
      multiplier: 1,
      prepWeeks: 0,
      shootWeeks: shootWeeks,
      wrapWeeks: 0,
      subtotal: 0,
      itemType: type
    }
    setLineItems([...lineItems, newItem])
    setShowAddLineModal(false)
  }

  const updateLineItem = (id: string, field: keyof BudgetLineItem, value: number | string) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        updated.subtotal = calculateSubtotal(updated)
        return updated
      }
      return item
    }))
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(m => m.id !== id))
  }

  // Calculate totals by category
  const laborItems = lineItems.filter(i => i.itemType === 'labor')
  const equipmentItems = lineItems.filter(i => i.itemType === 'equipment' || i.itemType === 'rental')
  const otherItems = lineItems.filter(i => i.itemType === 'purchase' || i.itemType === 'allowance' || i.itemType === 'other')

  const totalLabor = laborItems.reduce((sum, m) => sum + m.subtotal, 0)
  const totalEquipment = equipmentItems.reduce((sum, m) => sum + m.subtotal, 0)
  const totalOther = otherItems.reduce((sum, m) => sum + m.subtotal, 0)
  const totalBeforeFringes = totalLabor + totalEquipment + totalOther
  const totalFringes = totalLabor * (fringeRate / 100)  // Fringes only on labor
  const grandTotal = totalBeforeFringes + totalFringes

  // Group by account code
  const itemsByAccount = lineItems.reduce((acc, item) => {
    if (!acc[item.accountCode]) {
      acc[item.accountCode] = []
    }
    acc[item.accountCode].push(item)
    return acc
  }, {} as Record<string, BudgetLineItem[]>)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const exportToExcel = () => {
    type ExportRow = {
      'Acct': string
      'Description': string
      Position: string
      Union: string
      Qty: number | string
      Unit: string
      Rate: number | string
      'Prep Wks': number | string
      'Shoot Wks': number | string
      'Wrap Wks': number | string
      Subtotal: number
    }

    const data: ExportRow[] = []

    // Sort by account code
    const sortedItems = [...lineItems].sort((a, b) => a.accountCode.localeCompare(b.accountCode))

    sortedItems.forEach(m => {
      data.push({
        'Acct': m.accountCode,
        'Description': m.description || getAccountName(m.accountCode),
        Position: m.position,
        Union: m.union,
        Qty: m.quantity,
        Unit: m.unit,
        Rate: m.rate,
        'Prep Wks': m.prepWeeks,
        'Shoot Wks': m.shootWeeks,
        'Wrap Wks': m.wrapWeeks,
        Subtotal: m.subtotal
      })
    })

    // Add totals
    data.push({
      'Acct': '', 'Description': '', Position: '', Union: '', Qty: '', Unit: '', Rate: '', 'Prep Wks': '', 'Shoot Wks': '', 'Wrap Wks': '', Subtotal: 0
    })
    data.push({
      'Acct': '', 'Description': 'Labor Subtotal', Position: '', Union: '', Qty: '', Unit: '', Rate: '', 'Prep Wks': '', 'Shoot Wks': '', 'Wrap Wks': '', Subtotal: totalLabor
    })
    data.push({
      'Acct': '', 'Description': 'Equipment & Rentals', Position: '', Union: '', Qty: '', Unit: '', Rate: '', 'Prep Wks': '', 'Shoot Wks': '', 'Wrap Wks': '', Subtotal: totalEquipment
    })
    data.push({
      'Acct': '', 'Description': 'Other Costs', Position: '', Union: '', Qty: '', Unit: '', Rate: '', 'Prep Wks': '', 'Shoot Wks': '', 'Wrap Wks': '', Subtotal: totalOther
    })
    data.push({
      'Acct': '', 'Description': `Fringes (${fringeRate}% on Labor)`, Position: '', Union: '', Qty: '', Unit: '', Rate: '', 'Prep Wks': '', 'Shoot Wks': '', 'Wrap Wks': '', Subtotal: totalFringes
    })
    data.push({
      'Acct': '', 'Description': 'GRAND TOTAL', Position: '', Union: '', Qty: '', Unit: '', Rate: '', 'Prep Wks': '', 'Shoot Wks': '', 'Wrap Wks': '', Subtotal: grandTotal
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Production Budget')

    ws['!cols'] = [
      { wch: 6 },  // Acct
      { wch: 20 }, // Description
      { wch: 25 }, // Position
      { wch: 18 }, // Union
      { wch: 5 },  // Qty
      { wch: 8 },  // Unit
      { wch: 10 }, // Rate
      { wch: 8 },  // Prep
      { wch: 8 },  // Shoot
      { wch: 8 },  // Wrap
      { wch: 12 }  // Subtotal
    ]

    XLSX.writeFile(wb, `production_budget_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF('landscape')

    doc.setFontSize(20)
    doc.text('Production Budget', 14, 22)

    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)
    doc.text(`Schedule: ${prepWeeks} Prep | ${shootWeeks} Shoot | ${wrapWeeks} Wrap = ${totalProductionWeeks} Total Weeks`, 14, 36)
    doc.text(`Fringe Rate: ${fringeRate}%`, 14, 42)

    // Sort by account code
    const sortedItems = [...lineItems].sort((a, b) => a.accountCode.localeCompare(b.accountCode))

    const tableData = sortedItems.map(m => [
      m.accountCode,
      m.position,
      m.union || '-',
      formatCurrency(m.rate),
      m.unit,
      m.quantity.toString(),
      m.prepWeeks.toString(),
      m.shootWeeks.toString(),
      m.wrapWeeks.toString(),
      formatCurrency(m.subtotal)
    ])

    autoTable(doc, {
      head: [['Acct', 'Position', 'Union', 'Rate', 'Unit', 'Qty', 'Prep', 'Shoot', 'Wrap', 'Subtotal']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
      }
    })

    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    doc.setFontSize(10)
    doc.text(`Labor Subtotal: ${formatCurrency(totalLabor)}`, 14, finalY)
    doc.text(`Equipment & Rentals: ${formatCurrency(totalEquipment)}`, 14, finalY + 6)
    doc.text(`Other Costs: ${formatCurrency(totalOther)}`, 14, finalY + 12)
    doc.text(`Fringes (${fringeRate}%): ${formatCurrency(totalFringes)}`, 14, finalY + 18)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Grand Total: ${formatCurrency(grandTotal)}`, 14, finalY + 28)

    doc.save(`production_budget_${new Date().toISOString().split('T')[0]}.pdf`)
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
    if (!budgetName.trim() || lineItems.length === 0) return

    try {
      const payload = {
        name: budgetName,
        description: budgetDescription,
        production_weeks: totalProductionWeeks,
        fringe_rate: fringeRate,
        crew_data: lineItems,
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

      // Handle both old format (crew_data) and new format (lineItems)
      const data = budget.crew_data
      if (data && data.length > 0) {
        // Check if it's old format (has 'weeks' field) or new format (has 'accountCode')
        if (data[0].weeks !== undefined && data[0].accountCode === undefined) {
          // Convert old format to new format
          const converted = data.map((old: { position: string; union: string; rate: number; rateType: string; quantity: number; weeks: number; department?: string }) => ({
            id: crypto.randomUUID(),
            accountCode: getAccountCode(old.union, old.position),
            description: '',
            position: old.position,
            union: old.union,
            quantity: old.quantity,
            unit: old.rateType as UnitType,
            rate: old.rate,
            multiplier: old.rateType === 'hourly' ? 10 : old.rateType === 'daily' ? 5 : 1,
            prepWeeks: Math.floor(old.weeks * 0.25),
            shootWeeks: Math.floor(old.weeks * 0.6),
            wrapWeeks: Math.floor(old.weeks * 0.15),
            subtotal: 0,
            itemType: 'labor' as const
          }))
          const updated = converted.map((m: BudgetLineItem) => ({ ...m, subtotal: calculateSubtotal(m) }))
          setLineItems(updated)
        } else {
          // New format - recalculate subtotals
          const updated = data.map((item: BudgetLineItem) => ({ ...item, subtotal: calculateSubtotal(item) }))
          setLineItems(updated)
        }
      }

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
    setLineItems([])
    setCurrentBudgetId(null)
    setBudgetName('')
    setBudgetDescription('')
    setPrepWeeks(4)
    setShootWeeks(8)
    setWrapWeeks(2)
    setFringeRate(30)
  }

  const suggestFringes = async () => {
    if (lineItems.length === 0) return

    const laborOnly = lineItems.filter(i => i.itemType === 'labor')
    const unionCounts: Record<string, number> = {}
    laborOnly.forEach(m => {
      if (m.union) unionCounts[m.union] = (unionCounts[m.union] || 0) + 1
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
      const newItems: BudgetLineItem[] = []

      for (const pos of template.crew_data) {
        try {
          const rateResponse = await axios.get(`${API_URL}/api/rate-cards/smart-lookup`, {
            params: { query: pos.position }
          })

          if (rateResponse.data.data && rateResponse.data.data.length > 0) {
            const rateData = rateResponse.data.data[0]
            const unitType = rateData.rate_type as UnitType
            const accountCode = getAccountCode(rateData.union_local, rateData.job_classification)

            newItems.push({
              id: crypto.randomUUID(),
              accountCode,
              description: '',
              position: rateData.job_classification,
              union: rateData.union_local,
              quantity: pos.quantity,
              unit: unitType === 'hourly' ? 'hourly' : unitType === 'daily' ? 'daily' : 'weekly',
              rate: parseFloat(rateData.base_rate),
              multiplier: unitType === 'hourly' ? 10 : unitType === 'daily' ? 5 : 1,
              prepWeeks: Math.floor(pos.weeks * 0.25),
              shootWeeks: Math.floor(pos.weeks * 0.6),
              wrapWeeks: Math.floor(pos.weeks * 0.15),
              subtotal: 0,
              itemType: 'labor'
            })
          } else {
            const accountCode = getAccountCode(pos.union, pos.position)
            newItems.push({
              id: crypto.randomUUID(),
              accountCode,
              description: '',
              position: pos.position,
              union: pos.union,
              quantity: pos.quantity,
              unit: (pos.rateType || 'weekly') as UnitType,
              rate: 0,
              multiplier: 1,
              prepWeeks: Math.floor(pos.weeks * 0.25),
              shootWeeks: Math.floor(pos.weeks * 0.6),
              wrapWeeks: Math.floor(pos.weeks * 0.15),
              subtotal: 0,
              itemType: 'labor'
            })
          }
        } catch {
          const accountCode = getAccountCode(pos.union, pos.position)
          newItems.push({
            id: crypto.randomUUID(),
            accountCode,
            description: '',
            position: pos.position,
            union: pos.union,
            quantity: pos.quantity,
            unit: (pos.rateType || 'weekly') as UnitType,
            rate: 0,
            multiplier: 1,
            prepWeeks: Math.floor(pos.weeks * 0.25),
            shootWeeks: Math.floor(pos.weeks * 0.6),
            wrapWeeks: Math.floor(pos.weeks * 0.15),
            subtotal: 0,
            itemType: 'labor'
          })
        }
      }

      const updatedItems = newItems.map(m => ({
        ...m,
        subtotal: calculateSubtotal(m)
      }))

      setLineItems([...lineItems, ...updatedItems])
      setShowTemplateModal(false)
      alert(`Added ${updatedItems.length} positions from "${template.name}" template`)
    } catch (error) {
      console.error('Error applying template:', error)
      alert('Failed to apply template')
    } finally {
      setLoading(false)
    }
  }

  const toggleAccountCollapse = (code: string) => {
    setCollapsedAccounts(prev => ({ ...prev, [code]: !prev[code] }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Production Budget Calculator
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {currentBudgetId ? `Editing: ${budgetName}` : 'Build a production budget with industry-standard account codes'}
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
            disabled={lineItems.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Production Schedule */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Production Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prep Weeks
            </label>
            <input
              type="number"
              value={prepWeeks}
              onChange={(e) => setPrepWeeks(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shoot Weeks
            </label>
            <input
              type="number"
              value={shootWeeks}
              onChange={(e) => setShootWeeks(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Wrap Weeks
            </label>
            <input
              type="number"
              value={wrapWeeks}
              onChange={(e) => setWrapWeeks(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Weeks
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md font-semibold">
              {totalProductionWeeks}
            </div>
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
                disabled={lineItems.length === 0}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm disabled:opacity-50"
                title="Auto-suggest based on union rates"
              >
                Auto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Line Item */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add Line Item</h2>
          <button
            onClick={() => setShowAddLineModal(true)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
          >
            + Non-Labor Item
          </button>
        </div>
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

      {/* Budget Line Items */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Budget Line Items ({lineItems.length})</h2>
          <div className="flex gap-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'flat' | 'byAccount' | 'byDepartment')}
              className="px-3 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="flat">Flat View</option>
              <option value="byAccount">By Account</option>
              <option value="byDepartment">By Department</option>
            </select>
          </div>
        </div>

        {lineItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No line items added. Search for positions above or use a template.
          </p>
        ) : viewMode === 'byAccount' ? (
          <div className="space-y-4">
            {Object.entries(itemsByAccount)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([code, items]) => {
                const accountTotal = items.reduce((sum, i) => sum + i.subtotal, 0)
                const isCollapsed = collapsedAccounts[code]
                return (
                  <div key={code} className="border rounded-md dark:border-gray-700">
                    <div
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer"
                      onClick={() => toggleAccountCollapse(code)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{isCollapsed ? '▶' : '▼'}</span>
                        <span className="font-mono text-sm text-gray-500">{code}</span>
                        <span className="font-semibold">{getAccountName(code)}</span>
                        <span className="text-sm text-gray-500">({items.length} items)</span>
                      </div>
                      <span className="font-semibold text-green-600">{formatCurrency(accountTotal)}</span>
                    </div>
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-750">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Union</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prep</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shoot</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Wrap</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                              <th className="px-3 py-2"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 text-sm font-medium">{item.position}</td>
                                <td className="px-3 py-2 text-sm text-gray-500">{item.union || '-'}</td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm">{item.unit}</td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-14 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={item.prepWeeks}
                                    onChange={(e) => updateLineItem(item.id, 'prepWeeks', parseInt(e.target.value) || 0)}
                                    className="w-12 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={item.shootWeeks}
                                    onChange={(e) => updateLineItem(item.id, 'shootWeeks', parseInt(e.target.value) || 0)}
                                    className="w-12 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={item.wrapWeeks}
                                    onChange={(e) => updateLineItem(item.id, 'wrapWeeks', parseInt(e.target.value) || 0)}
                                    className="w-12 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                  />
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-green-600">
                                  {formatCurrency(item.subtotal)}
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => removeLineItem(item.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acct</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Union</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prep</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shoot</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Wrap</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[...lineItems]
                  .sort((a, b) => viewMode === 'byDepartment'
                    ? getDepartmentFromCode(a.accountCode).localeCompare(getDepartmentFromCode(b.accountCode))
                    : a.accountCode.localeCompare(b.accountCode))
                  .map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-sm font-mono text-gray-500">{item.accountCode}</td>
                    <td className="px-3 py-2 text-sm font-medium">{item.position}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{item.union || '-'}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm">{item.unit}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-14 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.prepWeeks}
                        onChange={(e) => updateLineItem(item.id, 'prepWeeks', parseInt(e.target.value) || 0)}
                        className="w-12 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.shootWeeks}
                        onChange={(e) => updateLineItem(item.id, 'shootWeeks', parseInt(e.target.value) || 0)}
                        className="w-12 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.wrapWeeks}
                        onChange={(e) => updateLineItem(item.id, 'wrapWeeks', parseInt(e.target.value) || 0)}
                        className="w-12 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-green-600">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Budget Summary */}
      {lineItems.length > 0 && (
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

          {/* Account Totals */}
          <div className="mb-4 border-b pb-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">By Account</h4>
            <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
              {Object.entries(itemsByAccount)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([code, items]) => {
                  const total = items.reduce((sum, i) => sum + i.subtotal, 0)
                  return (
                    <div key={code} className="flex justify-between">
                      <span className="text-gray-600">
                        <span className="font-mono text-xs text-gray-400 mr-2">{code}</span>
                        {getAccountName(code)}
                      </span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>Labor Subtotal:</span>
              <span className="font-semibold">{formatCurrency(totalLabor)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Equipment & Rentals:</span>
              <span className="font-semibold">{formatCurrency(totalEquipment)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Other Costs:</span>
              <span className="font-semibold">{formatCurrency(totalOther)}</span>
            </div>
            <div className="flex justify-between text-lg border-t pt-2">
              <span>Subtotal Before Fringes:</span>
              <span className="font-semibold">{formatCurrency(totalBeforeFringes)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Fringes ({fringeRate}% on Labor):</span>
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
                  placeholder="e.g., Feature Film - Full Budget"
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
                        {budget.crew_count} line items | {formatCurrency(parseFloat(budget.grand_total || '0'))} total
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

      {/* Add Non-Labor Line Modal */}
      {showAddLineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Non-Labor Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Item Type</label>
                <select
                  value={newLineType}
                  onChange={(e) => setNewLineType(e.target.value as typeof newLineType)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="equipment">Equipment Package</option>
                  <option value="rental">Rental</option>
                  <option value="purchase">Purchase / Expendables</option>
                  <option value="allowance">Allowance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account</label>
                <select
                  id="accountSelect"
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  {Object.values(ACCOUNT_CATEGORIES).flatMap(cat =>
                    cat.accounts.map(acc => (
                      <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddLineModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const select = document.getElementById('accountSelect') as HTMLSelectElement
                  addNonLaborItem(newLineType, select.value)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
