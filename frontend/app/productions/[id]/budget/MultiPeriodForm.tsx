'use client';

import { useState } from 'react';

interface Period {
  days: number;
  hours_per_day: number;
  rate: number;
}

interface Periods {
  prep: Period;
  shoot: Period;
  hiatus: Period;
  wrap: Period;
  holiday: Period;
}

interface MultiPeriodFormProps {
  periods: Periods;
  onPeriodsChange: (periods: Periods) => void;
  baseRate?: number;
}

export default function MultiPeriodForm({ periods, onPeriodsChange, baseRate }: MultiPeriodFormProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(['prep', 'shoot']));

  const periodLabels = {
    prep: 'Prep',
    shoot: 'Shoot',
    hiatus: 'Hiatus',
    wrap: 'Wrap',
    holiday: 'Holiday'
  };

  const periodColors = {
    prep: 'bg-blue-50 border-blue-200',
    shoot: 'bg-green-50 border-green-200',
    hiatus: 'bg-yellow-50 border-yellow-200',
    wrap: 'bg-purple-50 border-purple-200',
    holiday: 'bg-gray-50 border-gray-200'
  };

  const updatePeriod = (periodName: keyof Periods, field: keyof Period, value: number) => {
    onPeriodsChange({
      ...periods,
      [periodName]: {
        ...periods[periodName],
        [field]: value
      }
    });
  };

  const togglePeriod = (periodName: string) => {
    const newExpanded = new Set(expandedPeriods);
    if (expandedPeriods.has(periodName)) {
      newExpanded.delete(periodName);
    } else {
      newExpanded.add(periodName);
    }
    setExpandedPeriods(newExpanded);
  };

  const calculatePeriodTotal = (period: Period) => {
    return period.days * period.hours_per_day * period.rate;
  };

  const calculateGrandTotal = () => {
    return Object.values(periods).reduce((sum, period) => {
      return sum + calculatePeriodTotal(period);
    }, 0);
  };

  const applyBaseRateToAll = () => {
    if (!baseRate) return;

    const updated: Periods = { ...periods };
    (Object.keys(updated) as Array<keyof Periods>).forEach(periodName => {
      updated[periodName] = {
        ...updated[periodName],
        rate: baseRate
      };
    });
    onPeriodsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">Multi-Period Breakdown</h4>
        {baseRate && (
          <button
            type="button"
            onClick={applyBaseRateToAll}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Apply ${baseRate}/hr to all periods
          </button>
        )}
      </div>

      {(Object.keys(periodLabels) as Array<keyof typeof periodLabels>).map((periodName) => {
        const period = periods[periodName];
        const isExpanded = expandedPeriods.has(periodName);
        const periodTotal = calculatePeriodTotal(period);
        const hasData = period.days > 0 || period.hours_per_day > 0 || period.rate > 0;

        return (
          <div key={periodName} className={`border rounded-lg p-3 ${periodColors[periodName]}`}>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => togglePeriod(periodName)}
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {periodLabels[periodName]}
                </span>
                {hasData && (
                  <span className="text-xs text-gray-500">
                    ({period.days}d × {period.hours_per_day}h × ${period.rate}/hr)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-900">
                  ${periodTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-gray-400">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Days
                  </label>
                  <input
                    type="number"
                    value={period.days || ''}
                    onChange={(e) => updatePeriod(periodName, 'days', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hours/Day
                  </label>
                  <input
                    type="number"
                    value={period.hours_per_day || ''}
                    onChange={(e) => updatePeriod(periodName, 'hours_per_day', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    value={period.rate || ''}
                    onChange={(e) => updatePeriod(periodName, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Grand Total */}
      <div className="pt-3 border-t border-gray-300">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Total (All Periods):</span>
          <span className="text-lg font-bold text-gray-900">
            ${calculateGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
