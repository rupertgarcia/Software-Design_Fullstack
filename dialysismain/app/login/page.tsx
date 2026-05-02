"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'admin' && password === '1234567890') {
      const session = { username: 'admin', isAdmin: true };
      localStorage.setItem('dialysis_session', JSON.stringify(session));
      router.push('/');
    } else if (username && password) {
      // Normal user logic
      const session = { username: username, isAdmin: false };
      localStorage.setItem('dialysis_session', JSON.stringify(session));
      router.push('/');
    } else {
      setError('Please enter both username and password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-[#e2e8f0]">
        <div className="bg-[#0d9488] p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Dialysis Records</h1>
          <p className="text-teal-50/80 mt-1 text-sm uppercase tracking-wider font-medium">Session Manager Login</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm font-medium rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-teal-500/10 focus:border-[#0d9488] transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-teal-500/10 focus:border-[#0d9488] transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold py-3.5 rounded-lg shadow-lg shadow-teal-500/20 transform transition-all active:scale-[0.98] focus:ring-4 focus:ring-teal-500/20 outline-none"
          >
            Login to Dashboard
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Demo Access: admin / 1234567890
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
