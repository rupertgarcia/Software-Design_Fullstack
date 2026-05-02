"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse, Hospital, LayoutList, LogOut, User as UserIcon, CircleCheck, CircleAlert, Info, TriangleAlert, X, Users } from 'lucide-react';
import { DialysisRecord, UserSession } from '@/types';
import RecordForm from '@/components/RecordForm';
import RecordViewer from '@/components/RecordViewer';
import PatientManager from '@/components/PatientManager';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'records' | 'patients'>('home');
  const [editingRecord, setEditingRecord] = useState<DialysisRecord | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedSession = localStorage.getItem('dialysis_session');
    if (!storedSession) {
      router.push('/login');
    } else {
      setSession(JSON.parse(storedSession));
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('dialysis_session');
    router.push('/login');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleEditRecord = (record: DialysisRecord) => {
    setEditingRecord(record);
    setActiveTab('home');
    showToast(`Loaded record ${record.record_id} for editing`, 'info');
  };

  const handleRecordSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditingRecord(null);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setActiveTab('records');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        <p className="text-gray-500 font-medium">Loading Dashboard...</p>
      </div>
    </div>
  );

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col no-print">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-2 rounded-lg shadow-lg shadow-teal-500/20">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-gray-800 tracking-tight">
            Dialysis<span className="text-teal-600">Records</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('home'); setEditingRecord(null); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === 'home' ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Hospital className="w-4 h-4" /> Home
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === 'records' ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <LayoutList className="w-4 h-4" /> Records
            </button>
            {session.isAdmin && (
              <button
                onClick={() => setActiveTab('patients')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === 'patients' ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Users className="w-4 h-4" /> Patients
              </button>
            )}
          </div>

          <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden sm:block"></div>

          <div className="flex items-center gap-3 pl-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Logged in as</span>
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-teal-500" />
                {session.username} {session.isAdmin && <span className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-black">Admin</span>}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                <Hospital className="w-7 h-7 text-teal-600" />
                {editingRecord ? `Editing Record: ${editingRecord.record_id}` : 'Session Entry Form'}
              </h2>
              <p className="text-gray-500 font-medium mt-1">Enter patient dialysis session details below.</p>
            </div>
            <RecordForm 
              session={session} 
              editingRecord={editingRecord}
              onSuccess={handleRecordSuccess}
              onCancel={handleCancelEdit}
              onShowToast={showToast}
            />
          </div>
        )}
        
        {activeTab === 'records' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <RecordViewer 
              session={session} 
              onEdit={handleEditRecord}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}

        {activeTab === 'patients' && session.isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PatientManager 
              session={session} 
              onShowToast={showToast}
            />
          </div>
        )}
      </main>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-l-4 min-w-[300px] animate-in slide-in-from-right-10 duration-300",
              toast.type === 'success' && "bg-white border-emerald-500 text-gray-800",
              toast.type === 'error' && "bg-white border-red-500 text-gray-800",
              toast.type === 'info' && "bg-white border-blue-500 text-gray-800",
              toast.type === 'warning' && "bg-white border-amber-500 text-gray-800"
            )}
          >
            <div className={cn(
              "p-2 rounded-full",
              toast.type === 'success' && "bg-emerald-50 text-emerald-600",
              toast.type === 'error' && "bg-red-50 text-red-600",
              toast.type === 'info' && "bg-blue-50 text-blue-600",
              toast.type === 'warning' && "bg-amber-50 text-amber-600"
            )}>
              {toast.type === 'success' && <CircleCheck className="w-5 h-5" />}
              {toast.type === 'error' && <CircleAlert className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
              {toast.type === 'warning' && <TriangleAlert className="w-5 h-5" />}
            </div>
            <p className="flex-1 font-semibold text-sm">{toast.message}</p>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-100 mt-auto">
        <p>&copy; 2026 Trepurtech Dialysis System. All rights reserved.</p>
      </footer>
    </div>
  );
}
