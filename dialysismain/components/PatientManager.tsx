"use client";

import { useState, useEffect } from 'react';
import { User, Plus, Search, Trash2, Save, X, Edit2, Users } from 'lucide-react';
import { Patient, UserSession } from '@/types';
import { supabase } from '@/lib/supabase';

interface PatientManagerProps {
  session: UserSession | null;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function PatientManager({ session, onShowToast }: PatientManagerProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<Partial<Patient>>({
    first_name: '',
    last_name: '',
    default_pre_weight: '',
    default_pre_bp: '',
    default_uf_goal: '',
    default_dialyzer_type: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) {
      onShowToast('Error fetching patients', 'error');
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.isAdmin) return;

    try {
      const dataToSave = {
        ...formData,
        default_pre_weight: parseFloat(formData.default_pre_weight as string) || 0,
        default_uf_goal: parseFloat(formData.default_uf_goal as string) || 0
      };

      if (editingPatient) {
        const { error } = await supabase
          .from('patients')
          .update(dataToSave)
          .eq('id', editingPatient.id);
        if (error) throw error;
        onShowToast('Patient updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('patients')
          .insert([dataToSave]);
        if (error) throw error;
        onShowToast('Patient added successfully', 'success');
      }

      setIsAdding(false);
      setEditingPatient(null);
      resetForm();
      fetchPatients();
    } catch (error: any) {
      onShowToast(error.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.isAdmin || !confirm('Are you sure you want to delete this patient?')) return;

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      if (error) throw error;
      onShowToast('Patient deleted', 'warning');
      fetchPatients();
    } catch (error: any) {
      onShowToast(error.message || 'Deletion failed', 'error');
    }
  };

  const startEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData(patient);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      default_pre_weight: '',
      default_pre_bp: '',
      default_uf_goal: '',
      default_dialyzer_type: ''
    });
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && patients.length === 0) {
    return <div className="p-10 text-center">Loading patient records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-teal-600" /> Patient Database</h2>
          <p className="text-gray-500 text-sm">Manage patient profiles and default session values.</p>
        </div>
        {!isAdding && session?.isAdmin && (
          <button onClick={() => setIsAdding(true)} className="btn btn-green">
            <Plus className="w-4 h-4" /> Add New Patient
          </button>
        )}
      </div>

      {isAdding && session?.isAdmin && (
        <div className="form-card animate-in fade-in zoom-in duration-300">
          <div className="card-header">
            {editingPatient ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingPatient ? 'Edit Patient Profile' : 'New Patient Profile'}
          </div>
          <form onSubmit={handleSave} className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" required value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" required value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Default Pre-Weight (kg)</label>
                <input 
                  type="number" step="0.1" value={formData.default_pre_weight}
                  onChange={e => setFormData({...formData, default_pre_weight: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Default Pre-BP</label>
                <input 
                  type="text" placeholder="120/80" value={formData.default_pre_bp}
                  onChange={e => setFormData({...formData, default_pre_bp: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Default UF Goal (L)</label>
                <input 
                  type="number" step="0.1" value={formData.default_uf_goal}
                  onChange={e => setFormData({...formData, default_uf_goal: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Default Dialyzer</label>
                <select 
                  value={formData.default_dialyzer_type}
                  onChange={e => setFormData({...formData, default_dialyzer_type: e.target.value})}
                >
                  <option value="">Select Dialyzer</option>
                  {['Type A', 'Type B', 'Type C', 'High Flux', 'Low Flux'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setIsAdding(false); setEditingPatient(null); resetForm(); }} className="btn btn-gray">
                Cancel
              </button>
              <button type="submit" className="btn btn-blue">
                <Save className="w-4 h-4" /> {editingPatient ? 'Update Patient' : 'Save Patient'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Patient List */}
      <div className="form-card">
        <div className="card-header bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              className="pl-10 w-full max-w-md border-none focus:ring-0"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Patient Name</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Default Weight</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Default BP</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Default UF</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{p.last_name}, {p.first_name}</td>
                  <td className="px-6 py-4 text-gray-600">{p.default_pre_weight} kg</td>
                  <td className="px-6 py-4 text-gray-600">{p.default_pre_bp}</td>
                  <td className="px-6 py-4 text-gray-600">{p.default_uf_goal} L</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
