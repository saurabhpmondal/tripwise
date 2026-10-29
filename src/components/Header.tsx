import React from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, logout } from '../lib/firebase';
import { Compass, LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="flex items-center gap-2 shrink-0">
        <Compass className="w-6 h-6 text-indigo-600" />
        <a href="/" className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
          TripWise
        </a>
      </div>

      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <a href="/" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">Dashboard</a>
        <a href="#" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">Planning</a>
        <a href="#" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">Resources</a>
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-slate-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
              )}
              <span className="font-medium">{user.displayName?.split(' ')[0]}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Sign In with Google
          </button>
        )}
      </div>
    </header>
  );
};
