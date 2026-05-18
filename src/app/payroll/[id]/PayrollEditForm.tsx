'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PayrollEditFormProps {
  payroll: any;
  autoOpenCalculate?: boolean;
  readOnly?: boolean;
}

export function PayrollEditForm({ payroll, autoOpenCalculate = false, readOnly = false }: PayrollEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    totalAmount: payroll.totalAmount.toString(),
    status: payroll.status,
    notes: payroll.notes || ''
  });
  const [calcData, setCalcData] = useState({
    cutoffDate: new Date().toISOString().slice(0, 10),
    adjustmentAmount: '0',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/payroll/${payroll.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: parseFloat(formData.totalAmount),
          status: formData.status,
          notes: formData.notes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update payroll record');
      }

      router.push('/payroll');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsCalculating(true);

    try {
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: payroll.userId,
          cutoffDate: calcData.cutoffDate,
          adjustmentAmount: Number(calcData.adjustmentAmount || 0),
          notes: calcData.notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to calculate payroll');
      }

      setFormData((prev) => ({
        ...prev,
        totalAmount: Number(data.totalAmount).toFixed(2),
        status: 'DRAFT',
        notes: data.payroll?.notes ?? prev.notes
      }));
      setSuccess(
        `Calculated: ${data.workedDays} day(s), ${Number(data.totalHours).toFixed(2)} hours, total ${Number(data.totalAmount).toFixed(2)} MMK.`
      );
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6">
      {autoOpenCalculate && !readOnly && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary mb-4">
          Calculate mode opened from payroll list. Review the period and adjustment, then click Calculate.
        </div>
      )}

      {!readOnly && (
      <form onSubmit={handleCalculate} className="space-y-4 mb-6 pb-6 border-b border-white/5">
        <h3 className="text-lg font-semibold text-white">Calculate This Record</h3>
        <p className="text-sm text-slate-400">
          Recalculate this user from month start to selected date, then apply bonus/deduction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Calculate Until Date</label>
            <input
              type="date"
              required
              value={calcData.cutoffDate}
              onChange={(e) => setCalcData({ ...calcData, cutoffDate: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Adjustment (+/-)</label>
            <input
              type="number"
              step="0.01"
              value={calcData.adjustmentAmount}
              onChange={(e) => setCalcData({ ...calcData, adjustmentAmount: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. 100 or -50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Calculation Note</label>
          <textarea
            value={calcData.notes}
            onChange={(e) => setCalcData({ ...calcData, notes: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none"
            placeholder="Optional note for this calculation"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isCalculating}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {isCalculating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Calculate
          </button>
        </div>
      </form>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>}
        {success && <div className="p-3 bg-success/10 text-success text-sm rounded-lg">{success}</div>}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Final Payout Amount (MMK)</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.totalAmount}
            disabled={readOnly}
            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold text-lg disabled:opacity-60"
          />
          <p className="text-xs text-slate-500 mt-1">Originally calculated based on approved hours and base rate. Modify this to add bonuses or deductions.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Payment Status</label>
          <select
            value={formData.status}
            disabled={readOnly}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
          >
            <option value="DRAFT">Draft</option>
            <option value="FINALIZED">Finalized (Ready to Pay)</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Accountant Notes / Adjustments</label>
          <textarea
            value={formData.notes}
            disabled={readOnly}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none disabled:opacity-60"
            placeholder="e.g., Added 50,000 MMK performance bonus for this month."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
          <Link
            href="/payroll"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </Link>
          {!readOnly && (
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
