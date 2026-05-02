"use client";

import { useState, useEffect, useMemo } from 'react';
import { Database, Filter, Search, X, Check, Printer, FileText, FolderOpen, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { DialysisRecord, UserSession } from '@/types';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface RecordViewerProps {
  session: UserSession | null;
  onEdit: (record: DialysisRecord) => void;
  refreshTrigger: number;
}

type SortColumn = 'record_id' | 'name' | 'session_date' | 'start_time';
type SortDirection = 'asc' | 'desc';

export default function RecordViewer({ session, onEdit, refreshTrigger }: RecordViewerProps) {
  const [records, setRecords] = useState<DialysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('session_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
      .select('*');

    if (error) {
      console.error('Error fetching records:', error);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredRecords = useMemo(() => {
    let result = records.filter(r => {
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

    // Apply Sorting
    result.sort((a, b) => {
      let valA: any, valB: any;
      
      if (sortColumn === 'name') {
        valA = `${a.last_name} ${a.first_name}`.toLowerCase();
        valB = `${b.last_name} ${b.first_name}`.toLowerCase();
      } else {
        valA = a[sortColumn];
        valB = b[sortColumn];
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, filterName, filterDateFrom, filterDateTo, filterNurse, filterMachine, filterDialyzer, filterFluidMin, filterFluidMax, sortColumn, sortDirection]);

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
      'Time': `${formatTime(r.start_time)} - ${formatTime(r.end_time)}`,
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
    });
  }, [filteredRecords, printDateFrom, printDateTo]);

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-teal-600" /> : <ChevronDown className="w-3 h-3 text-teal-600" />;
  };

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
                {Array.from({length: 10}, (_, i) => (i+1).toString()).map(n => (
                  <option key={n} value={n}>Machine {n}</option>
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
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                <th onClick={() => handleSort('record_id')} className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">ID <SortIcon col="record_id" /></div>
                </th>
                <th onClick={() => handleSort('name')} className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">Patient Name <SortIcon col="name" /></div>
                </th>
                <th onClick={() => handleSort('session_date')} className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors w-[120px]">
                  <div className="flex items-center gap-2">Date <SortIcon col="session_date" /></div>
                </th>
                <th onClick={() => handleSort('start_time')} className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors w-[180px]">
                  <div className="flex items-center gap-2">Session Time <SortIcon col="start_time" /></div>
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Machine</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Dialyzer</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">BP/Wt (Pre)</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">BP/Wt (Post)</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Goal/Net</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nurse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(record => (
                  <tr 
                    key={record.id} 
                    onClick={() => onEdit(record)}
                    className="hover:bg-teal-50/30 cursor-pointer transition-all group"
                  >
                    <td className="px-6 py-4 font-black text-teal-600 text-sm">{record.record_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 group-hover:text-teal-900 transition-colors">{record.last_name}, {record.first_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600 whitespace-normal break-words leading-tight">
                      {format(new Date(record.session_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-normal break-words leading-tight">
                      <div className="font-bold text-gray-800">{formatTime(record.start_time)}</div>
                      <div className="text-gray-400 text-[10px] font-bold">to {formatTime(record.end_time)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-black uppercase">M-{record.machine_number}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{record.dialyzer_type}</td>
                    <td className="px-6 py-4 text-xs leading-relaxed">
                      <div className="font-bold text-gray-800">{record.pre_bp}</div>
                      <div className="text-gray-400 font-medium">{record.pre_weight}kg</div>
                    </td>
                    <td className="px-6 py-4 text-xs leading-relaxed">
                      <div className="font-bold text-gray-800">{record.post_bp}</div>
                      <div className="text-gray-400 font-medium">{record.post_weight}kg</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-teal-700">{record.uf_goal}L Goal</span>
                        <span className="text-[10px] font-bold text-slate-400">{record.fluid_removed}L Removed</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-500">{record.nurse}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <FolderOpen className="w-12 h-12 mb-2 text-gray-200" />
                      <p className="font-medium">No records found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
      <div className="print-only-container p-10">
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
              <th>Session Time</th>
              <th>Machine</th>
              <th>Dialyzer</th>
              <th>BP/Wt (Pre)</th>
              <th>BP/Wt (Post)</th>
              <th>Goal/Net</th>
              <th>Nurse</th>
            </tr>
          </thead>
          <tbody>
            {printRecords.map(r => (
              <tr key={r.id}>
                <td className="font-bold">{r.record_id}</td>
                <td>{r.last_name}, {r.first_name}</td>
                <td>{format(new Date(r.session_date), 'MMM dd, yyyy')}</td>
                <td>{formatTime(r.start_time)} - {formatTime(r.end_time)}</td>
                <td>M-{r.machine_number}</td>
                <td>{r.dialyzer_type}</td>
                <td>{r.pre_bp} / {r.pre_weight}kg</td>
                <td>{r.post_bp} / {r.post_weight}kg</td>
                <td>{r.uf_goal}L / {r.fluid_removed}L</td>
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
