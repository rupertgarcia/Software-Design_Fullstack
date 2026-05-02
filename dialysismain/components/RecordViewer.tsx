"use client";

import { useState, useEffect, useMemo } from 'react';
import { Database, Filter, Search, X, Check, Printer, FileText, FolderOpen, ChevronDown } from 'lucide-react';
import { DialysisRecord, UserSession } from '@/types';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface RecordViewerProps {
  session: UserSession | null;
  onEdit: (record: DialysisRecord) => void;
  refreshTrigger: number;
}

export default function RecordViewer({ session, onEdit, refreshTrigger }: RecordViewerProps) {
  const [records, setRecords] = useState<DialysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterNurse, setFilterNurse] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  const [filterDialyzer, setFilterDialyzer] = useState('');
  const [filterFluidMin, setFilterFluidMin] = useState('');
  const [filterFluidMax, setFilterFluidMax] = useState('');

  // Print Settings
  const [printDateFrom, setPrintDateFrom] = useState('');
  const [printDateTo, setPrintDateTo] = useState('');
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');

  useEffect(() => {
    fetchRecords();
  }, [refreshTrigger]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dialysis_records')
      .select('*')
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
      const matchesName = fullName.includes(filterName.toLowerCase());
      const matchesDateFrom = !filterDateFrom || r.session_date >= filterDateFrom;
      const matchesDateTo = !filterDateTo || r.session_date <= filterDateTo;
      const matchesNurse = !filterNurse || r.nurse === filterNurse;
      const matchesMachine = !filterMachine || r.machine_number === filterMachine;
      const matchesDialyzer = !filterDialyzer || r.dialyzer_type === filterDialyzer;
      const matchesFluidMin = !filterFluidMin || r.fluid_removed >= parseFloat(filterFluidMin);
      const matchesFluidMax = !filterFluidMax || r.fluid_removed <= parseFloat(filterFluidMax);

      return matchesName && matchesDateFrom && matchesDateTo && matchesNurse && 
             matchesMachine && matchesDialyzer && matchesFluidMin && matchesFluidMax;
    });
  }, [records, filterName, filterDateFrom, filterDateTo, filterNurse, filterMachine, filterDialyzer, filterFluidMin, filterFluidMax]);

  const clearFilters = () => {
    setFilterName('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterNurse('');
    setFilterMachine('');
    setFilterDialyzer('');
    setFilterFluidMin('');
    setFilterFluidMax('');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportXLSX = () => {
    const dataToExport = filteredRecords.map(r => ({
      'Record ID': r.record_id,
      'First Name': r.first_name,
      'Last Name': r.last_name,
      'Date': r.session_date,
      'Time': `${r.start_time} - ${r.end_time}`,
      'Machine': `Machine ${r.machine_number}`,
      'Dialyzer': r.dialyzer_type,
      'Pre-BP': r.pre_bp,
      'Pre-Weight': r.pre_weight,
      'Post-BP': r.post_bp,
      'Post-Weight': r.post_weight,
      'UF Goal': r.uf_goal,
      'Fluid Removed': r.fluid_removed,
      'Nurse': r.nurse,
      'Remarks': r.remarks
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dialysis Records');
    XLSX.writeFile(workbook, `Dialysis_Records_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const printRecords = useMemo(() => {
    return filteredRecords.filter(r => {
      const matchesFrom = !printDateFrom || r.session_date >= printDateFrom;
      const matchesTo = !printDateTo || r.session_date <= printDateTo;
      return matchesFrom && matchesTo;
    }).sort((a, b) => a.session_date.localeCompare(b.session_date));
  }, [filteredRecords, printDateFrom, printDateTo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-teal-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
        <p className="font-medium">Loading records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Database className="w-5 h-5 text-teal-600" /> Database Records</h2>
          <p className="text-gray-500 text-sm">Manage and filter dialysis sessions.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportXLSX} className="btn btn-green">
            <FileText className="w-4 h-4" /> Export to Excel
          </button>
          <button onClick={() => setIsPrintModalOpen(true)} className="btn btn-blue">
            <Printer className="w-4 h-4" /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="form-card">
        <div className="card-header">
          <Filter className="w-5 h-5 text-teal-600" /> Smart Filtering
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-group md:col-span-2 lg:col-span-4">
              <label>Search Patient</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search first or last name..."
                  className="pl-10 w-full"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>From Date</label>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Nurse</label>
              <select value={filterNurse} onChange={(e) => setFilterNurse(e.target.value)}>
                <option value="">All Nurses</option>
                {['Nurse Alice', 'Nurse Bob', 'Nurse Carol', 'Nurse Dan', 'Nurse Eve'].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Machine Number</label>
              <select value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)}>
                <option value="">All Machines</option>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n.toString()}>Machine {n}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Dialyzer Type</label>
              <select value={filterDialyzer} onChange={(e) => setFilterDialyzer(e.target.value)}>
                <option value="">All Dialyzers</option>
                {['Type A', 'Type B', 'Type C', 'High Flux', 'Low Flux'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Min Fluid (L)</label>
              <input type="number" step="0.1" placeholder="Min." value={filterFluidMin} onChange={(e) => setFilterFluidMin(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Max Fluid (L)</label>
              <input type="number" step="0.1" placeholder="Max." value={filterFluidMax} onChange={(e) => setFilterFluidMax(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
            <button onClick={clearFilters} className="btn btn-gray">
              <X className="w-4 h-4" /> Clear Filters
            </button>
            <button className="btn btn-blue">
              <Check className="w-4 h-4" /> Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Machine</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Dialyzer</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Pre BP/Wt</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Post BP/Wt</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">UF/Net</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nurse</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => (
                <tr 
                  key={record.id} 
                  onClick={() => onEdit(record)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-4 font-bold text-teal-700">{record.record_id}</td>
                  <td className="px-4 py-4 font-medium text-gray-900">{record.first_name} {record.last_name}</td>
                  <td className="px-4 py-4 text-gray-600">{record.session_date}</td>
                  <td className="px-4 py-4 text-gray-600">{record.start_time} - {record.end_time}</td>
                  <td className="px-4 py-4 text-gray-600">M-{record.machine_number}</td>
                  <td className="px-4 py-4 text-gray-600">{record.dialyzer_type}</td>
                  <td className="px-4 py-4 text-xs text-gray-600">
                    <span className="font-bold">{record.pre_bp}</span><br />
                    <span>{record.pre_weight} kg</span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-600">
                    <span className="font-bold">{record.post_bp}</span><br />
                    <span>{record.post_weight} kg</span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{record.uf_goal}L / {record.fluid_removed}L</td>
                  <td className="px-4 py-4 text-gray-600">{record.nurse}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-20 text-center text-gray-400">
                  <div className="flex flex-col items-center">
                    <FolderOpen className="w-12 h-12 mb-2 text-gray-200" />
                    <p>No records found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-teal-50">
              <h3 className="text-lg font-bold flex items-center gap-2 text-teal-800">
                <Printer className="w-5 h-5" /> Export to PDF
              </h3>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-gray-600">Select date range to include in the report:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" value={printDateFrom} onChange={(e) => setPrintDateFrom(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" value={printDateTo} onChange={(e) => setPrintDateTo(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Orientation</label>
                <select 
                  className="w-full"
                  value={printOrientation} 
                  onChange={(e) => setPrintOrientation(e.target.value as any)}
                >
                  <option value="landscape">Landscape (Recommended)</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsPrintModalOpen(false)} className="btn btn-gray">Cancel</button>
              <button 
                onClick={handlePrint}
                className="btn btn-blue"
                disabled={printRecords.length === 0}
              >
                <FileText className="w-4 h-4" /> Generate Preview ({printRecords.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Only Content */}
      <div className="hidden print:block p-10 print-only">
        <div className="text-center mb-10 border-b-2 border-teal-600 pb-6">
          <h1 className="text-3xl font-black text-teal-800 uppercase tracking-tighter">Dialysis Session Records Report</h1>
          <p className="text-gray-500 mt-2 font-medium">
            Generated on {format(new Date(), 'PPpp')} 
            {printDateFrom && ` | Period: ${printDateFrom} to ${printDateTo || 'Today'}`}
          </p>
          <p className="text-teal-600 font-bold mt-1">Total Sessions: {printRecords.length}</p>
        </div>
        <table className="print-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient Name</th>
              <th>Date</th>
              <th>Machine</th>
              <th>Dialyzer</th>
              <th>Pre BP/Wt</th>
              <th>Post BP/Wt</th>
              <th>UF Goal</th>
              <th>Net Fluid</th>
              <th>Nurse</th>
            </tr>
          </thead>
          <tbody>
            {printRecords.map(r => (
              <tr key={r.id}>
                <td className="font-bold">{r.record_id}</td>
                <td>{r.last_name}, {r.first_name}</td>
                <td>{r.session_date}</td>
                <td>M-{r.machine_number}</td>
                <td>{r.dialyzer_type}</td>
                <td>{r.pre_bp} / {r.pre_weight}kg</td>
                <td>{r.post_bp} / {r.post_weight}kg</td>
                <td>{r.uf_goal}L</td>
                <td>{r.fluid_removed}L</td>
                <td>{r.nurse}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-12 text-center text-xs text-gray-400 italic">
          <p>This is a computer-generated report from the Trepurtech Dialysis System.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: ${printOrientation};
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
