"use client";

import { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, X, User, Calendar, Clock, Activity, FileText, Search, UserCheck } from 'lucide-react';
import { DialysisRecord, UserSession, Patient } from '@/types';
import { supabase } from '@/lib/supabase';

interface RecordFormProps {
  session: UserSession | null;
  editingRecord: DialysisRecord | null;
  onSuccess: () => void;
  onCancel: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function RecordForm({ session, editingRecord, onSuccess, onCancel, onShowToast }: RecordFormProps) {
  const [formData, setFormData] = useState<any>({
    first_name: '',
    last_name: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    machine_number: '',
    dialyzer_type: '',
    pre_bp: '',
    pre_weight: '',
    post_bp: '',
    post_weight: '',
    uf_goal: '',
    fluid_removed: '',
    nurse: session?.username || '',
    remarks: ''
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingRecord) {
      setFormData(editingRecord);
      setPatientSearchQuery(`${editingRecord.first_name} ${editingRecord.last_name}`);
    } else {
      clearForm();
    }
  }, [editingRecord]);

  useEffect(() => {
    fetchPatients();
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowPatientSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('*');
    if (data) setPatients(data);
  };

  const clearForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      session_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      machine_number: '',
      dialyzer_type: '',
      pre_bp: '',
      pre_weight: '',
      post_bp: '',
      post_weight: '',
      uf_goal: '',
      fluid_removed: '',
      nurse: session?.username || '',
      remarks: ''
    });
    setPatientSearchQuery('');
    setSelectedPatient(null);
  };

  const generateRecordId = async () => {
    const { data, error } = await supabase
      .from('dialysis_records')
      .select('record_id')
      .order('record_id', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return 'REC-0001';

    const lastId = data[0].record_id;
    const lastNum = parseInt(lastId.split('-')[1]);
    return `REC-${String(lastNum + 1).padStart(4, '0')}`;
  };

  const selectPatient = (patient: Patient) => {
    setFormData({
      ...formData,
      first_name: patient.first_name,
      last_name: patient.last_name,
      pre_weight: patient.default_pre_weight.toString(),
      pre_bp: patient.default_pre_bp,
      uf_goal: patient.default_uf_goal.toString(),
      dialyzer_type: patient.default_dialyzer_type
    });
    setSelectedPatient(patient);
    setPatientSearchQuery(`${patient.first_name} ${patient.last_name}`);
    setShowPatientSearch(false);
    onShowToast(`Loaded patient profile for ${patient.first_name}`, 'success');
  };

  const handleNameChange = (val: string) => {
    setPatientSearchQuery(val);
    setShowPatientSearch(true);
    
    // If typing manually, split into first and last name
    const parts = val.trim().split(' ');
    setFormData({
      ...formData,
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || ''
    });
    
    if (selectedPatient && val !== `${selectedPatient.first_name} ${selectedPatient.last_name}`) {
      setSelectedPatient(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const numericData = {
        ...formData,
        pre_weight: parseFloat(formData.pre_weight) || 0,
        post_weight: parseFloat(formData.post_weight) || 0,
        uf_goal: parseFloat(formData.uf_goal) || 0,
        fluid_removed: parseFloat(formData.fluid_removed) || 0,
      };

      if (editingRecord) {
        if (!session?.isAdmin) {
          onShowToast('Only admins can update records', 'error');
          return;
        }

        const { error } = await supabase
          .from('dialysis_records')
          .update(numericData)
          .eq('id', editingRecord.id);

        if (error) throw error;
        onShowToast('Record updated successfully', 'success');
      } else {
        const newRecordId = await generateRecordId();
        const { error } = await supabase
          .from('dialysis_records')
          .insert([{ ...numericData, record_id: newRecordId }]);

        if (error) throw error;
        onShowToast('Record added successfully', 'success');
      }
      
      onSuccess();
      if (!editingRecord) clearForm();
    } catch (error: any) {
      onShowToast(error.message || 'Error saving record', 'error');
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearchQuery.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="card-header">
        <div className="flex items-center gap-2">
          {editingRecord ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {editingRecord ? 'Update Session Record' : 'Create New Session Record'}
        </div>
      </div>

      <div className="card-body">
        {/* Unified Patient Search */}
        <div className="section-title">
          <Search className="w-4 h-4" /> Patient Selection
        </div>
        
        <div className="relative mb-8" ref={searchRef}>
          <label className="block text-sm font-bold text-gray-700 mb-2">Search Patient or Enter Name <span className="text-red-500">*</span></label>
          <div className="relative group">
            <User className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", selectedPatient ? "text-teal-500" : "text-gray-400")} />
            <input
              type="text"
              required
              className={cn(
                "w-full pl-12 pr-4 py-4 text-lg font-bold rounded-2xl border-2 transition-all outline-none",
                selectedPatient 
                  ? "bg-teal-50 border-teal-200 text-teal-900 focus:border-teal-500" 
                  : "bg-white border-gray-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-sm"
              )}
              placeholder="Start typing patient name..."
              value={patientSearchQuery}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => setShowPatientSearch(true)}
            />
            {selectedPatient && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 animate-in zoom-in">
                <UserCheck className="w-3 h-3" /> REGISTERED PATIENT
              </div>
            )}
          </div>
          
          {showPatientSearch && patientSearchQuery.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] max-h-60 overflow-y-auto">
              {filteredPatients.length > 0 ? (
                <div className="p-2">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-2">Found in Database</div>
                  {filteredPatients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPatient(p)}
                      className="w-full text-left px-4 py-3 hover:bg-teal-50 rounded-xl flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-teal-700">{p.last_name}, {p.first_name}</div>
                        <div className="text-xs text-gray-500">Goal: {p.default_uf_goal}L • Dialyzer: {p.default_dialyzer_type}</div>
                      </div>
                      <div className="text-xs font-bold text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        SELECT PATIENT
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-400 text-sm italic mb-2">No matching patient found in database.</p>
                  <button 
                    type="button"
                    onClick={() => setShowPatientSearch(false)}
                    className="text-xs font-bold text-teal-600 hover:underline"
                  >
                    Continue with manual entry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clinical Data */}
        <div className="section-title">
          <Activity className="w-4 h-4" /> Clinical Data
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-5 p-6 bg-teal-50/50 rounded-3xl border border-teal-100 shadow-sm shadow-teal-500/5">
            <h4 className="text-teal-800 font-bold flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Pre-Dialysis Status
            </h4>
            <div className="form-group">
              <label>Blood Pressure <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="120/80"
                value={formData.pre_bp}
                onChange={(e) => setFormData({ ...formData, pre_bp: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Weight (kg) <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.pre_weight}
                onChange={(e) => setFormData({ ...formData, pre_weight: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-5 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-slate-800 font-bold flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-slate-500 rounded-full"></span> Post-Dialysis Status
            </h4>
            <div className="form-group">
              <label>Blood Pressure <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="110/70"
                value={formData.post_bp}
                onChange={(e) => setFormData({ ...formData, post_bp: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Weight (kg) <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.post_weight}
                onChange={(e) => setFormData({ ...formData, post_weight: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="section-title">
          <Calendar className="w-4 h-4" /> Session Config
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="form-group">
            <label>Date <span className="text-red-500">*</span></label>
            <input type="date" required value={formData.session_date} onChange={(e) => setFormData({ ...formData, session_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Start Time <span className="text-red-500">*</span></label>
            <input type="time" required value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
          </div>
          <div className="form-group">
            <label>End Time <span className="text-red-500">*</span></label>
            <input type="time" required value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Machine # <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.machine_number}
              onChange={(e) => setFormData({ ...formData, machine_number: e.target.value })}
            >
              <option value="">Select Machine</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n.toString()}>Machine {n}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Dialyzer Type <span className="text-red-500">*</span></label>
            <select required value={formData.dialyzer_type} onChange={(e) => setFormData({ ...formData, dialyzer_type: e.target.value })}>
              <option value="">Select Type</option>
              {['Type A', 'Type B', 'Type C', 'High Flux', 'Low Flux'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Assigned Nurse <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.nurse}
              onChange={(e) => setFormData({ ...formData, nurse: e.target.value })}
            >
              <option value="">Select Nurse</option>
              {['Nurse Alice', 'Nurse Bob', 'Nurse Carol', 'Nurse Dan', 'Nurse Eve'].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* UF Data */}
        <div className="section-title">
          <Activity className="w-4 h-4" /> UF Data
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="form-group">
            <label>UF Goal (L) <span className="text-red-500">*</span></label>
            <input type="number" step="0.1" required value={formData.uf_goal} onChange={(e) => setFormData({ ...formData, uf_goal: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Net Fluid Removed (L) <span className="text-red-500">*</span></label>
            <input type="number" step="0.1" required value={formData.fluid_removed} onChange={(e) => setFormData({ ...formData, fluid_removed: e.target.value })} />
          </div>
        </div>

        {/* Remarks */}
        <div className="form-group mb-8">
          <label className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Remarks / Observations
          </label>
          <textarea
            className="w-full min-h-[80px] rounded-2xl border-gray-100"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Add any additional notes here..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
          <button type="submit" className="btn btn-blue flex-1 py-4 text-lg shadow-xl shadow-teal-600/20">
            {editingRecord ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {editingRecord ? 'Update Session' : 'Save Session Record'}
          </button>
          
          {editingRecord && (
            <button type="button" onClick={onCancel} className="btn btn-gray py-4 px-8 text-lg">
              <X className="w-5 h-5" /> Cancel
            </button>
          )}
          
          {!editingRecord && (
            <button type="button" onClick={clearForm} className="btn btn-gray py-4 px-8 text-lg">
              <RefreshCw className="w-5 h-5" /> Clear
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
