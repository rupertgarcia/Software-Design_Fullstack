"use client";

import { useState, useEffect } from 'react';
import { User, Clock, Stethoscope, Droplet, Eraser, Plus, Trash2, Save, X } from 'lucide-react';
import { DialysisRecord, UserSession } from '@/types';
import { supabase } from '@/lib/supabase';

interface RecordFormProps {
  session: UserSession | null;
  editingRecord: DialysisRecord | null;
  onSuccess: () => void;
  onCancel: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function RecordForm({ session, editingRecord, onSuccess, onCancel, onShowToast }: RecordFormProps) {
  const [formData, setFormData] = useState<Partial<DialysisRecord>>({
    first_name: '',
    last_name: '',
    session_date: '',
    start_time: '',
    end_time: '',
    machine_number: '',
    dialyzer_type: '',
    pre_bp: '',
    pre_weight: 0,
    post_bp: '',
    post_weight: 0,
    uf_goal: 0,
    fluid_removed: 0,
    nurse: '',
    remarks: ''
  });

  useEffect(() => {
    if (editingRecord) {
      setFormData(editingRecord);
    } else {
      clearForm();
    }
  }, [editingRecord]);

  const clearForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      session_date: '',
      start_time: '',
      end_time: '',
      machine_number: '',
      dialyzer_type: '',
      pre_bp: '',
      pre_weight: 0,
      post_bp: '',
      post_weight: 0,
      uf_goal: 0,
      fluid_removed: 0,
      nurse: '',
      remarks: ''
    });
  };

  const generateRecordId = async () => {
    const { data, error } = await supabase
      .from('dialysis_records')
      .select('record_id');
    
    if (error) {
      console.error('Error fetching records for ID generation:', error);
      return 'REC-1001';
    }

    if (!data || data.length === 0) return 'REC-1001';

    const ids = data.map((r: { record_id: string }) => {
      const match = r.record_id.match(/REC-(\d+)/);
      return match ? parseInt(match[1]) : 1000;
    });

    const maxId = Math.max(...ids);
    return `REC-${maxId + 1}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRecord) {
        // Update
        if (!session?.isAdmin) {
          onShowToast('Only admins can update records', 'error');
          return;
        }

        const { error } = await supabase
          .from('dialysis_records')
          .update(formData)
          .eq('id', editingRecord.id);

        if (error) throw error;
        onShowToast('Record updated successfully', 'success');
      } else {
        // Add
        const newRecordId = await generateRecordId();
        const { error } = await supabase
          .from('dialysis_records')
          .insert([{ ...formData, record_id: newRecordId }]);

        if (error) throw error;
        onShowToast('Record added successfully', 'success');
      }
      
      onSuccess();
      clearForm();
    } catch (error: any) {
      onShowToast(error.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingRecord || !session?.isAdmin) return;
    
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        const { error } = await supabase
          .from('dialysis_records')
          .delete()
          .eq('id', editingRecord.id);

        if (error) throw error;
        onShowToast('Record deleted successfully', 'warning');
        onSuccess();
        clearForm();
      } catch (error: any) {
        onShowToast(error.message || 'Deletion failed', 'error');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Info Card */}
      <div className="form-card">
        <div className="card-header">
          <User className="w-5 h-5 text-teal-600" /> Patient Information
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="form-group">
            <label>First Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="e.g., John"
            />
          </div>
          <div className="form-group">
            <label>Last Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="e.g., Doe"
            />
          </div>
        </div>
      </div>

      {/* Session Details Card */}
      <div className="form-card">
        <div className="card-header">
          <Clock className="w-5 h-5 text-teal-600" /> Session Details
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="form-group">
            <label>Session Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              required
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Start Time <span className="text-red-500">*</span></label>
            <input
              type="time"
              required
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>End Time <span className="text-red-500">*</span></label>
            <input
              type="time"
              required
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Machine Number <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.machine_number}
              onChange={(e) => setFormData({ ...formData, machine_number: e.target.value })}
            >
              <option value="" disabled>Select Machine</option>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n.toString()}>Machine {n}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Dialyzer Type <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.dialyzer_type}
              onChange={(e) => setFormData({ ...formData, dialyzer_type: e.target.value })}
            >
              <option value="" disabled>Select Dialyzer</option>
              {['Type A', 'Type B', 'Type C', 'High Flux', 'Low Flux'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vitals Card */}
      <div className="form-card">
        <div className="card-header">
          <Stethoscope className="w-5 h-5 text-teal-600" /> Vitals
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pre-Dialysis</h4>
            <div className="form-group">
              <label>Blood Pressure (mmHg) <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                pattern="\d{2,3}\/\d{2,3}"
                value={formData.pre_bp}
                onChange={(e) => setFormData({ ...formData, pre_bp: e.target.value })}
                placeholder="e.g., 120/80"
              />
            </div>
            <div className="form-group">
              <label>Weight (kg) <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.pre_weight}
                onChange={(e) => setFormData({ ...formData, pre_weight: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Post-Dialysis</h4>
            <div className="form-group">
              <label>Blood Pressure (mmHg) <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                pattern="\d{2,3}\/\d{2,3}"
                value={formData.post_bp}
                onChange={(e) => setFormData({ ...formData, post_bp: e.target.value })}
                placeholder="e.g., 110/70"
              />
            </div>
            <div className="form-group">
              <label>Weight (kg) <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.post_weight}
                onChange={(e) => setFormData({ ...formData, post_weight: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fluids & Staff Card */}
      <div className="form-card">
        <div className="card-header">
          <Droplet className="w-5 h-5 text-teal-600" /> Fluids & Staff
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="form-group">
            <label>UF Goal (L) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.uf_goal}
              onChange={(e) => setFormData({ ...formData, uf_goal: parseFloat(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Net Fluid Removed (L) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.fluid_removed}
              onChange={(e) => setFormData({ ...formData, fluid_removed: parseFloat(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Attending Nurse <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.nurse}
              onChange={(e) => setFormData({ ...formData, nurse: e.target.value })}
            >
              <option value="" disabled>Select Nurse</option>
              {['Nurse Alice', 'Nurse Bob', 'Nurse Carol', 'Nurse Dan', 'Nurse Eve'].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="form-group md:col-span-2">
            <label>Remarks</label>
            <textarea
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Enter any notes or complications..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4 py-4">
        <button type="button" onClick={clearForm} className="btn btn-gray">
          <Eraser className="w-4 h-4" /> Clear Form
        </button>
        <div className="flex gap-3">
          {editingRecord && session?.isAdmin && (
            <button type="button" onClick={handleDelete} className="btn btn-red">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          {editingRecord ? (
            <div className="flex gap-2">
               <button type="button" onClick={onCancel} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300">
                <X className="w-4 h-4" /> Cancel
              </button>
              {session?.isAdmin && (
                <button type="submit" className="btn btn-blue">
                  <Save className="w-4 h-4" /> Update Record
                </button>
              )}
            </div>
          ) : (
            <button type="submit" className="btn btn-green">
              <Plus className="w-4 h-4" /> Add Record
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
