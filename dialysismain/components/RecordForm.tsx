"use client";

import { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, X, User, Calendar, Clock, Activity, FileText, Search } from 'lucide-react';
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
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingRecord) {
      setFormData(editingRecord);
    } else {
      clearForm();
    }
  }, [editingRecord]);

  useEffect(() => {
    fetchPatients();
    
    // Close search dropdown when clicking outside
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
    setShowPatientSearch(false);
    setPatientSearchQuery('');
    onShowToast(`Loaded defaults for ${patient.first_name}`, 'info');
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
      <div className="card-header flex justify-between items-center">
        <div className="flex items-center gap-2">
          {editingRecord ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {editingRecord ? 'Update Session Record' : 'Create New Session Record'}
        </div>
        {!editingRecord && (
          <div className="relative" ref={searchRef}>
            <div className="flex items-center bg-white/20 rounded-lg px-3 py-1 text-sm border border-white/30 focus-within:bg-white/30 transition-all">
              <Search className="w-4 h-4 mr-2" />
              <input 
                type="text" 
                placeholder="Search patient..." 
                className="bg-transparent border-none focus:ring-0 p-0 text-white placeholder:text-teal-50/70 w-32 md:w-48"
                value={patientSearchQuery}
                onFocus={() => setShowPatientSearch(true)}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value);
                  setShowPatientSearch(true);
                }}
              />
            </div>
            
            {showPatientSearch && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] max-h-60 overflow-y-auto text-gray-800">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPatient(p)}
                      className="w-full text-left px-4 py-3 hover:bg-teal-50 flex flex-col border-b border-gray-50 last:border-0"
                    >
                      <span className="font-bold text-gray-900">{p.last_name}, {p.first_name}</span>
                      <span className="text-xs text-gray-500">Goal: {p.default_uf_goal}L • Wt: {p.default_pre_weight}kg</span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">No patients found</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card-body">
        {/* Patient Info */}
        <div className="section-title">
          <User className="w-4 h-4" /> Patient Information
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="form-group">
            <label>First Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="Enter first name"
            />
          </div>
          <div className="form-group">
            <label>Last Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Enter last name"
            />
          </div>
        </div>

        {/* Session Details */}
        <div className="section-title">
          <Calendar className="w-4 h-4" /> Session Details
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="form-group">
            <label>Date <span className="text-red-500">*</span></label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="date"
                required
                className="pl-10"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Start Time <span className="text-red-500">*</span></label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="time"
                required
                className="pl-10"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>End Time <span className="text-red-500">*</span></label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="time"
                required
                className="pl-10"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Machine # <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.machine_number}
              onChange={(e) => setFormData({ ...formData, machine_number: e.target.value })}
              placeholder="e.g. M-01"
            />
          </div>
          <div className="form-group">
            <label>Dialyzer Type <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.dialyzer_type}
              onChange={(e) => setFormData({ ...formData, dialyzer_type: e.target.value })}
            >
              <option value="">Select Type</option>
              <option value="Type A">Type A</option>
              <option value="Type B">Type B</option>
              <option value="Type C">Type C</option>
              <option value="High Flux">High Flux</option>
              <option value="Low Flux">Low Flux</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assigned Nurse <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.nurse}
              onChange={(e) => setFormData({ ...formData, nurse: e.target.value })}
            />
          </div>
        </div>

        {/* Clinical Data */}
        <div className="section-title">
          <Activity className="w-4 h-4" /> Clinical Data
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-5 p-5 bg-teal-50/50 rounded-2xl border border-teal-100">
            <h4 className="text-teal-800 font-bold flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Pre-Dialysis
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

          <div className="space-y-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
            <h4 className="text-slate-800 font-bold flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-slate-500 rounded-full"></span> Post-Dialysis
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

        {/* UF Data */}
        <div className="section-title">
          <Activity className="w-4 h-4" /> UF Data
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="form-group">
            <label>UF Goal (L) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.uf_goal}
              onChange={(e) => setFormData({ ...formData, uf_goal: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Net Fluid Removed (L) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.fluid_removed}
              onChange={(e) => setFormData({ ...formData, fluid_removed: e.target.value })}
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="form-group mb-8">
          <label className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Remarks / Observations
          </label>
          <textarea
            className="w-full min-h-[100px]"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Add any additional notes here..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
          <button type="submit" className="btn btn-blue flex-1 py-4 text-lg">
            {editingRecord ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {editingRecord ? 'Update Session' : 'Save Session Record'}
          </button>
          
          {editingRecord && (
            <button type="button" onClick={onCancel} className="btn btn-gray py-4 text-lg">
              <X className="w-5 h-5" /> Cancel Edit
            </button>
          )}
          
          {!editingRecord && (
            <button type="button" onClick={clearForm} className="btn btn-gray py-4 text-lg">
              <RefreshCw className="w-5 h-5" /> Clear Form
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
