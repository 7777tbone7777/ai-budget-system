'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app';

interface CustomSideletter {
  id: number;
  production_id: number;
  name: string;
  union_local: string;
  base_sideletter_id?: number;
  custom_wage_adjustment?: number;
  custom_holiday_pay?: number;
  custom_vacation_pay?: number;
  custom_pension?: number;
  custom_health_welfare?: number;
  overtime_rules?: any;
  meal_penalties?: any;
  turnaround_rules?: any;
  location_provisions?: any;
  agreement_notes?: string;
  document_url?: string;
  negotiated_by?: string;
  union_approved?: boolean;
  approval_date?: string;
  union_contact?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface StandardSideletter {
  id: number;
  name: string;
  union_local: string;
  description?: string;
  production_type_filter?: string;
}

interface AppliedSideletter {
  id?: string;
  sideletter_name: string;
  union_local?: string;
  wage_adjustment_pct?: string;
  holiday_pay_pct?: string;
  vacation_pay_pct?: string;
  production_type?: string;
  distribution_platform?: string;
  description?: string;
}

interface Production {
  id: number;
  name: string;
  production_type: string;
  distribution_platform?: string;
  shooting_location?: string;
  has_custom_agreements?: boolean;
  custom_sideletters?: number[];
  applied_sideletters?: AppliedSideletter[];
}

export default function CustomSidelettersPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [production, setProduction] = useState<Production | null>(null);
  const [customSideletters, setCustomSideletters] = useState<CustomSideletter[]>([]);
  const [standardSideletters, setStandardSideletters] = useState<StandardSideletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSideletters, setExpandedSideletters] = useState<Set<number>>(new Set());

  const toggleSideletter = (idx: number) => {
    setExpandedSideletters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [editingSideletter, setEditingSideletter] = useState<CustomSideletter | null>(null);
  const [selectedStandardId, setSelectedStandardId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // New/Edit form fields
  const [formData, setFormData] = useState({
    name: '',
    union_local: '',
    custom_wage_adjustment: '',
    custom_holiday_pay: '',
    custom_vacation_pay: '',
    custom_pension: '',
    custom_health_welfare: '',
    agreement_notes: '',
    document_url: '',
    negotiated_by: '',
    union_contact: '',
    overtime_rules: '',
    meal_penalties: '',
    turnaround_rules: '',
    location_provisions: ''
  });

  const unionLocals = [
    'IATSE Local 44',
    'IATSE Local 52',
    'IATSE Local 80',
    'IATSE Local 600',
    'IATSE Local 695',
    'IATSE Local 700',
    'IATSE Local 705',
    'IATSE Local 706',
    'IATSE Local 728',
    'IATSE Local 729',
    'IATSE Videotape',
    'DGA',
    'SAG-AFTRA',
    'WGA',
    'Teamsters Local 399',
    'Teamsters Local 817',
    'AFM',
    'Non-Union'
  ];

  useEffect(() => {
    loadData();
  }, [productionId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, sidelettersRes, standardRes] = await Promise.all([
        fetch(`${API_URL}/api/productions/${productionId}`),
        fetch(`${API_URL}/api/productions/${productionId}/custom-sideletters`),
        fetch(`${API_URL}/api/sideletter-rules?limit=100`)
      ]);

      const [prodData, sidelettersData, standardData] = await Promise.all([
        prodRes.json(),
        sidelettersRes.json(),
        standardRes.json()
      ]);

      if (prodData.data) {
        setProduction(prodData.data);
      } else if (prodData.production) {
        setProduction(prodData.production);
      }
      if (sidelettersData.success) {
        setCustomSideletters(sidelettersData.custom_sideletters || []);
      }
      if (standardData.success) {
        setStandardSideletters(standardData.sideletter_rules || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load sideletter data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      union_local: '',
      custom_wage_adjustment: '',
      custom_holiday_pay: '',
      custom_vacation_pay: '',
      custom_pension: '',
      custom_health_welfare: '',
      agreement_notes: '',
      document_url: '',
      negotiated_by: '',
      union_contact: '',
      overtime_rules: '',
      meal_penalties: '',
      turnaround_rules: '',
      location_provisions: ''
    });
  };

  const openEditForm = (sideletter: CustomSideletter) => {
    setEditingSideletter(sideletter);
    setFormData({
      name: sideletter.name || '',
      union_local: sideletter.union_local || '',
      custom_wage_adjustment: sideletter.custom_wage_adjustment?.toString() || '',
      custom_holiday_pay: sideletter.custom_holiday_pay?.toString() || '',
      custom_vacation_pay: sideletter.custom_vacation_pay?.toString() || '',
      custom_pension: sideletter.custom_pension?.toString() || '',
      custom_health_welfare: sideletter.custom_health_welfare?.toString() || '',
      agreement_notes: sideletter.agreement_notes || '',
      document_url: sideletter.document_url || '',
      negotiated_by: sideletter.negotiated_by || '',
      union_contact: sideletter.union_contact || '',
      overtime_rules: sideletter.overtime_rules ? JSON.stringify(sideletter.overtime_rules, null, 2) : '',
      meal_penalties: sideletter.meal_penalties ? JSON.stringify(sideletter.meal_penalties, null, 2) : '',
      turnaround_rules: sideletter.turnaround_rules ? JSON.stringify(sideletter.turnaround_rules, null, 2) : '',
      location_provisions: sideletter.location_provisions ? JSON.stringify(sideletter.location_provisions, null, 2) : ''
    });
    setShowCreateForm(true);
  };

  const handleCreateNew = () => {
    setEditingSideletter(null);
    resetForm();
    setShowCreateForm(true);
  };

  const handleCloneStandard = async () => {
    if (!selectedStandardId) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/custom-sideletters/clone/${selectedStandardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ production_id: productionId })
      });

      const data = await response.json();
      if (data.success) {
        setShowCloneModal(false);
        setSelectedStandardId(null);
        await loadData();
        // Open the newly cloned sideletter for editing
        if (data.custom_sideletter) {
          openEditForm(data.custom_sideletter);
        }
      } else {
        setError(data.error || 'Failed to clone sideletter');
      }
    } catch (err) {
      console.error('Error cloning sideletter:', err);
      setError('Failed to clone sideletter');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.union_local) {
      setError('Name and Union Local are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Parse JSONB fields
      const parseJsonField = (field: string) => {
        if (!field) return null;
        try {
          return JSON.parse(field);
        } catch {
          return null;
        }
      };

      const payload = {
        name: formData.name,
        union_local: formData.union_local,
        custom_wage_adjustment: formData.custom_wage_adjustment ? parseFloat(formData.custom_wage_adjustment) : null,
        custom_holiday_pay: formData.custom_holiday_pay ? parseFloat(formData.custom_holiday_pay) : null,
        custom_vacation_pay: formData.custom_vacation_pay ? parseFloat(formData.custom_vacation_pay) : null,
        custom_pension: formData.custom_pension ? parseFloat(formData.custom_pension) : null,
        custom_health_welfare: formData.custom_health_welfare ? parseFloat(formData.custom_health_welfare) : null,
        agreement_notes: formData.agreement_notes || null,
        document_url: formData.document_url || null,
        negotiated_by: formData.negotiated_by || null,
        union_contact: formData.union_contact || null,
        overtime_rules: parseJsonField(formData.overtime_rules),
        meal_penalties: parseJsonField(formData.meal_penalties),
        turnaround_rules: parseJsonField(formData.turnaround_rules),
        location_provisions: parseJsonField(formData.location_provisions)
      };

      let response;
      if (editingSideletter) {
        // Update existing
        response = await fetch(`${API_URL}/api/custom-sideletters/${editingSideletter.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new
        response = await fetch(`${API_URL}/api/productions/${productionId}/custom-sideletters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (data.success) {
        setShowCreateForm(false);
        setEditingSideletter(null);
        resetForm();
        await loadData();
      } else {
        setError(data.error || 'Failed to save sideletter');
      }
    } catch (err) {
      console.error('Error saving sideletter:', err);
      setError('Failed to save sideletter');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this custom sideletter?')) return;

    try {
      const response = await fetch(`${API_URL}/api/custom-sideletters/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await loadData();
      } else {
        setError(data.error || 'Failed to delete sideletter');
      }
    } catch (err) {
      console.error('Error deleting sideletter:', err);
      setError('Failed to delete sideletter');
    }
  };

  const handleApplyToProduction = async (sideletterId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/productions/${productionId}/apply-custom-sideletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sideletter_id: sideletterId })
      });
      const data = await response.json();
      if (data.success) {
        await loadData();
      } else {
        setError(data.error || 'Failed to apply sideletter');
      }
    } catch (err) {
      console.error('Error applying sideletter:', err);
      setError('Failed to apply sideletter');
    }
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return `${value}%`;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>Loading...</div>
        <div style={{ color: '#666' }}>Fetching custom sideletters...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/productions')}
          style={{
            background: 'none',
            border: 'none',
            color: '#0066cc',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0',
            marginBottom: '12px'
          }}
        >
          ← Back to Productions
        </button>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>
          Sideletters
        </h1>
        <p style={{ margin: 0, color: '#666' }}>
          {production?.name || `Production #${productionId}`}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          color: '#c00',
          marginBottom: '20px'
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Applied Sideletters Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#333' }}>
          Applied Sideletters
        </h2>
        {production?.applied_sideletters && production.applied_sideletters.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {production.applied_sideletters.map((sideletter, idx) => {
              const isExpanded = expandedSideletters.has(idx);
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#f0f7ff',
                    borderRadius: '8px',
                    border: '1px solid #cce0ff',
                    overflow: 'hidden'
                  }}
                >
                  {/* Header - Clickable */}
                  <div
                    onClick={() => toggleSideletter(idx)}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#4a5568',
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                      }}>
                        ▶
                      </span>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: '#1a365d' }}>
                          {sideletter.sideletter_name}
                        </div>
                        {sideletter.union_local && (
                          <div style={{ fontSize: '14px', color: '#4a5568', marginTop: '2px' }}>
                            {sideletter.union_local}
                          </div>
                        )}
                      </div>
                    </div>
                    {sideletter.wage_adjustment_pct && sideletter.wage_adjustment_pct !== '0.00' && (
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#92400e'
                      }}>
                        {parseFloat(sideletter.wage_adjustment_pct) > 0 ? '+' : ''}{sideletter.wage_adjustment_pct}% wage adj.
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{
                      padding: '0 20px 16px 44px',
                      borderTop: '1px solid #cce0ff',
                      backgroundColor: '#f8fbff'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '16px',
                        paddingTop: '16px'
                      }}>
                        {/* Wage Adjustment */}
                        <div>
                          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Wage Adjustment
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a365d' }}>
                            {sideletter.wage_adjustment_pct ? `${parseFloat(sideletter.wage_adjustment_pct) > 0 ? '+' : ''}${sideletter.wage_adjustment_pct}%` : 'Standard'}
                          </div>
                        </div>

                        {/* Holiday Pay */}
                        <div>
                          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Holiday Pay
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a365d' }}>
                            {sideletter.holiday_pay_pct ? `${sideletter.holiday_pay_pct}%` : 'Standard'}
                          </div>
                        </div>

                        {/* Vacation Pay */}
                        <div>
                          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Vacation Pay
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a365d' }}>
                            {sideletter.vacation_pay_pct ? `${sideletter.vacation_pay_pct}%` : 'Standard'}
                          </div>
                        </div>

                        {/* Production Type */}
                        {sideletter.production_type && (
                          <div>
                            <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>
                              Production Type
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a365d' }}>
                              {sideletter.production_type}
                            </div>
                          </div>
                        )}

                        {/* Distribution Platform */}
                        {sideletter.distribution_platform && (
                          <div>
                            <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>
                              Distribution
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a365d' }}>
                              {sideletter.distribution_platform}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Description if available */}
                      {sideletter.description && (
                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Description
                          </div>
                          <div style={{ fontSize: '14px', color: '#4a5568' }}>
                            {sideletter.description}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            color: '#718096'
          }}>
            <p style={{ margin: 0 }}>
              No sideletters have been applied to this production yet.
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              Sideletters are typically applied when creating the production based on type, platform, and location.
            </p>
          </div>
        )}
      </div>

      {/* Custom Sideletters Section */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#333' }}>
          Custom Sideletters
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
          Create custom negotiated sideletters specific to this production.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={handleCreateNew}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            + Create New Sideletter
          </button>
          <button
            onClick={() => setShowCloneModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Clone from Standard
          </button>
        </div>
      </div>

      {/* Custom Sideletters List */}
      {customSideletters.length === 0 ? (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px dashed #ddd'
        }}>
          <p style={{ color: '#666', margin: 0 }}>
            No custom sideletters have been created for this production.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {customSideletters.map(sideletter => (
            <div
              key={sideletter.id}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
                    {sideletter.name}
                    {sideletter.union_approved && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        Union Approved
                      </span>
                    )}
                  </h3>
                  <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                    {sideletter.union_local}
                    {sideletter.base_sideletter_id && ' (cloned from standard)'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditForm(sideletter)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleApplyToProduction(sideletter.id)}
                    disabled={production?.custom_sideletters?.includes(sideletter.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: production?.custom_sideletters?.includes(sideletter.id) ? '#e0e0e0' : '#0066cc',
                      color: production?.custom_sideletters?.includes(sideletter.id) ? '#666' : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: production?.custom_sideletters?.includes(sideletter.id) ? 'default' : 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    {production?.custom_sideletters?.includes(sideletter.id) ? 'Applied' : 'Apply'}
                  </button>
                  <button
                    onClick={() => handleDelete(sideletter.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Rate Adjustments Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px',
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }}>
                {sideletter.custom_wage_adjustment && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Wage Adj.</div>
                    <div style={{ fontWeight: '600' }}>{formatPercent(sideletter.custom_wage_adjustment)}</div>
                  </div>
                )}
                {sideletter.custom_pension && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Pension</div>
                    <div style={{ fontWeight: '600' }}>{formatPercent(sideletter.custom_pension)}</div>
                  </div>
                )}
                {sideletter.custom_health_welfare && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Health & Welfare</div>
                    <div style={{ fontWeight: '600' }}>{formatPercent(sideletter.custom_health_welfare)}</div>
                  </div>
                )}
                {sideletter.custom_holiday_pay && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Holiday Pay</div>
                    <div style={{ fontWeight: '600' }}>{formatPercent(sideletter.custom_holiday_pay)}</div>
                  </div>
                )}
                {sideletter.custom_vacation_pay && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Vacation Pay</div>
                    <div style={{ fontWeight: '600' }}>{formatPercent(sideletter.custom_vacation_pay)}</div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {sideletter.agreement_notes && (
                <div style={{ marginTop: '12px', fontSize: '14px', color: '#555' }}>
                  <strong>Notes:</strong> {sideletter.agreement_notes}
                </div>
              )}

              {/* Metadata */}
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
                Created: {new Date(sideletter.created_at).toLocaleDateString()}
                {sideletter.negotiated_by && ` | Negotiated by: ${sideletter.negotiated_by}`}
                {sideletter.union_contact && ` | Union Contact: ${sideletter.union_contact}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0' }}>
              {editingSideletter ? 'Edit Custom Sideletter' : 'Create Custom Sideletter'}
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., 101 Studios IATSE Sideletter"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Union Local *
                  </label>
                  <select
                    value={formData.union_local}
                    onChange={(e) => setFormData({ ...formData, union_local: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Union...</option>
                    {unionLocals.map(local => (
                      <option key={local} value={local}>{local}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rate Adjustments */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  Rate Adjustments (%)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Wage Adjustment
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.custom_wage_adjustment}
                      onChange={(e) => setFormData({ ...formData, custom_wage_adjustment: e.target.value })}
                      placeholder="e.g., -5 for 5% reduction"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Pension
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.custom_pension}
                      onChange={(e) => setFormData({ ...formData, custom_pension: e.target.value })}
                      placeholder="e.g., 8.5"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Health & Welfare
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.custom_health_welfare}
                      onChange={(e) => setFormData({ ...formData, custom_health_welfare: e.target.value })}
                      placeholder="e.g., 10.5"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Holiday Pay
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.custom_holiday_pay}
                      onChange={(e) => setFormData({ ...formData, custom_holiday_pay: e.target.value })}
                      placeholder="e.g., 3.719"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Vacation Pay
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.custom_vacation_pay}
                      onChange={(e) => setFormData({ ...formData, custom_vacation_pay: e.target.value })}
                      placeholder="e.g., 4.0"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Rules (JSON) */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  Advanced Rules (JSON format)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Overtime Rules
                    </label>
                    <textarea
                      value={formData.overtime_rules}
                      onChange={(e) => setFormData({ ...formData, overtime_rules: e.target.value })}
                      placeholder='{"daily_ot_start": 8, "weekly_ot_start": 40}'
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Meal Penalties
                    </label>
                    <textarea
                      value={formData.meal_penalties}
                      onChange={(e) => setFormData({ ...formData, meal_penalties: e.target.value })}
                      placeholder='{"first_meal_due": 6, "penalty_amount": 50}'
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Turnaround Rules
                    </label>
                    <textarea
                      value={formData.turnaround_rules}
                      onChange={(e) => setFormData({ ...formData, turnaround_rules: e.target.value })}
                      placeholder='{"minimum_hours": 10, "forced_call_penalty": 100}'
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Location Provisions
                    </label>
                    <textarea
                      value={formData.location_provisions}
                      onChange={(e) => setFormData({ ...formData, location_provisions: e.target.value })}
                      placeholder='{"zone_rate": true, "per_diem": 75}'
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Documentation */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  Documentation & Approval
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Negotiated By
                    </label>
                    <input
                      type="text"
                      value={formData.negotiated_by}
                      onChange={(e) => setFormData({ ...formData, negotiated_by: e.target.value })}
                      placeholder="Name of negotiator"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Union Contact
                    </label>
                    <input
                      type="text"
                      value={formData.union_contact}
                      onChange={(e) => setFormData({ ...formData, union_contact: e.target.value })}
                      placeholder="Union rep name/email"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Document URL
                    </label>
                    <input
                      type="url"
                      value={formData.document_url}
                      onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                      placeholder="Link to signed PDF"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Agreement Notes
                    </label>
                    <textarea
                      value={formData.agreement_notes}
                      onChange={(e) => setFormData({ ...formData, agreement_notes: e.target.value })}
                      placeholder="Any additional notes about this agreement..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingSideletter(null);
                  resetForm();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : (editingSideletter ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone from Standard Modal */}
      {showCloneModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Clone from Standard Sideletter</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Select a standard sideletter to use as a starting point. You can customize it after cloning.
            </p>

            {standardSideletters.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>
                No standard sideletters available in the database.
              </p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                {standardSideletters.map(standard => (
                  <div
                    key={standard.id}
                    onClick={() => setSelectedStandardId(standard.id)}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      border: `2px solid ${selectedStandardId === standard.id ? '#0066cc' : '#eee'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: selectedStandardId === standard.id ? '#f0f7ff' : 'white'
                    }}
                  >
                    <div style={{ fontWeight: '500' }}>{standard.name}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{standard.union_local}</div>
                    {standard.description && (
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                        {standard.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowCloneModal(false);
                  setSelectedStandardId(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCloneStandard}
                disabled={!selectedStandardId || saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!selectedStandardId || saving) ? 'default' : 'pointer',
                  opacity: (!selectedStandardId || saving) ? 0.6 : 1
                }}
              >
                {saving ? 'Cloning...' : 'Clone & Edit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
