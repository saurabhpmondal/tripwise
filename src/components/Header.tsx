import React from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, logout } from '../lib/firebase';
import { Compass, LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between gap-8 px-8 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3 shrink-0 group">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <a href="/" className="text-xl font-black tracking-tighter text-slate-900 whitespace-nowrap">
          TripWise
        </a>
      </div>

      <nav className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-500">
        <a href="/" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 relative after:absolute after:bottom-[-22px] after:left-0 after:right-0 after:h-[3px] after:bg-indigo-600 after:rounded-t-full">Dashboard</a>
        <a href="#" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">Planning</a>
        <a href="#" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">Resources</a>
      </nav>

      <div className="flex items-center gap-6 shrink-0">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-black text-slate-900 leading-none">{user.displayName?.split(' ')[0]}</p>
                <p className="text-[10px] font-bold text-slate-400">Pro Traveler</p>
              </div>
              <div className="relative group/avatar">
                <img 
                  src={user.photoURL || "/src/assets/images/traveler_avatar_male_1793359073567.jpg"} 
                  alt={user.displayName || 'User'} 
                  className="w-10 h-10 rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-100 transition-transform group-hover/avatar:scale-105" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
