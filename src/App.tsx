import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TripDetail } from './components/TripDetail';
import { Trip } from './types';
import { signInWithGoogle } from './lib/firebase';
import { Compass, ShieldCheck, Zap, Globe } from 'lucide-react';
import { motion } from 'motion/react';

const Landing: React.FC = () => {
  const heroImage = "/src/assets/images/trip_planner_hero_1793276374555.jpg";
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImage} 
              alt="Trip Planning" 
              className="w-full h-full object-cover brightness-50"
            />
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                Plan Smarter. <br />
                <span className="text-indigo-400">Travel Further.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
                The modern way to track your travel expenses. Stay within budget and focus on what matters most: the journey.
              </p>
              <button
                onClick={signInWithGoogle}
                className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-500/20 active:scale-95"
              >
                Get Started for Free
              </button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to stay on track</h2>
              <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Multi-Trip Support</h3>
                <p className="text-slate-500">Plan and manage multiple journeys simultaneously with dedicated budgets for each.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Real-time Tracking</h3>
                <p className="text-slate-500">Add expenses on the go and see instant updates to your remaining balance.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
                <p className="text-slate-500">Your data is synced securely with Firebase, ensuring only you have access to your plans.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-12 px-6 text-center border-t border-slate-800">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Compass className="w-6 h-6 text-indigo-400" />
          <span className="text-lg font-bold text-white">TripWise</span>
        </div>
        <p className="text-slate-400 text-sm">© 2026 TripWise Expense Planner. Built for the modern traveler.</p>
      </footer>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="py-8">
        {selectedTrip ? (
          <TripDetail trip={selectedTrip} onBack={() => setSelectedTrip(null)} />
        ) : (
          <Dashboard onSelectTrip={setSelectedTrip} />
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
