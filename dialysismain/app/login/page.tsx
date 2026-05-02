"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse, Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: email === 'admin@example.com' ? 'admin' : 'user'
            }
          }
        });
        if (error) throw error;
        alert('Signup successful! Please check your email for verification (if enabled) or try logging in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
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
          <p className="text-teal-50/80 mt-1 text-sm uppercase tracking-wider font-medium">
            {isSignUp ? 'Create New Account' : 'Session Manager Login'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm font-medium rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-teal-500/10 focus:border-[#0d9488] transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-teal-500/10 focus:border-[#0d9488] transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-teal-500/20 transform transition-all active:scale-[0.98] focus:ring-4 focus:ring-teal-500/20 outline-none flex justify-center items-center gap-2"
          >
            {loading ? 'Processing...' : isSignUp ? (
              <><UserPlus className="w-5 h-5" /> Sign Up</>
            ) : (
              <><LogIn className="w-5 h-5" /> Login to Dashboard</>
            )}
          </button>
          
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-[#0d9488] font-semibold hover:underline"
            >
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
