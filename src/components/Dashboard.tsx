import React, { useState } from 'react';
import { useTrips } from '../hooks/useFirebase';
import { Trip } from '../types';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Wallet, 
  Trash2, 
  Edit2, 
  RotateCcw, 
  X, 
  Info, 
  CheckCircle2, 
  Clock,
  Archive,
  Globe,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  onSelectTrip: (trip: Trip) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTrip }) => {
  const [currentTab, setCurrentTab] = useState<'active' | 'completed' | 'all'>('active');
  const { trips, loading, addTrip, updateTrip, softDeleteTrip, restoreTrip, completeTrip, reactivateTrip } = useTrips(currentTab);
  const { trips: deletedTrips } = useTrips('deleted');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  
  const [tripForm, setTripForm] = useState({
    name: '',
    destination: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    budget: 0,
    coTravelers: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrip) {
      await updateTrip(editingTrip.id, tripForm);
      setEditingTrip(null);
    } else {
      await addTrip(tripForm);
      setShowAddModal(false);
    }
    setTripForm({
      name: '',
      destination: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      budget: 0,
      coTravelers: []
    });
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setTripForm({
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget,
      coTravelers: trip.coTravelers || []
    });
  };

  if (loading) return (
    <div className="p-32 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading Journeys...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-3">Your Journeys</h1>
          <p className="text-slate-500 text-lg font-medium max-w-md leading-relaxed">Design your perfect adventure, track every detail, and keep your budget in check.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-slate-100/80 p-2 rounded-2xl w-full sm:w-auto backdrop-blur-md border border-slate-200/50 shadow-sm">
            {[
              { id: 'active', label: 'Active', icon: Clock, color: 'text-indigo-600' },
              { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600' },
              { id: 'all', label: 'All Trips', icon: Globe, color: 'text-slate-900' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={cn(
                  "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-black rounded-xl transition-all whitespace-nowrap uppercase tracking-widest",
                  currentTab === tab.id ? "bg-white text-slate-900 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className={cn("w-4 h-4", currentTab === tab.id ? tab.color : "text-slate-300")} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => setShowTrashModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group"
            >
              <Trash2 className="w-5 h-5 group-hover:text-red-500 transition-colors" />
              <span className="text-xs font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg group-hover:bg-red-50 group-hover:text-red-600">{deletedTrips.length}</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-[2] sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 active:scale-95 transition-all shadow-2xl shadow-slate-200 uppercase tracking-widest text-xs font-black"
            >
              <Plus className="w-5 h-5" />
              <span>Plan New Trip</span>
            </button>
          </div>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-40 bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] shadow-inner flex items-center justify-center mb-8">
            {currentTab === 'active' ? <Globe className="w-12 h-12 text-indigo-200" /> : <Archive className="w-12 h-12 text-slate-200" />}
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
            {currentTab === 'active' ? "Where to next?" : "No journeys found"}
          </h3>
          <p className="text-slate-400 font-bold text-base mb-10 max-w-sm mx-auto leading-relaxed">
            {currentTab === 'active' 
              ? "Your dashboard is looking a bit empty. Let's start planning your first world-class adventure."
              : "We couldn't find any trips in this category. Try switching filters or start a new journey."}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-2xl shadow-indigo-100 uppercase tracking-widest"
          >
            Create My First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {trips.map((trip) => {
              const isMathura = trip.destination.toLowerCase().includes('mathura');
              const isTokyo = trip.destination.toLowerCase().includes('tokyo');
              const coverImg = isMathura 
                ? "/src/assets/images/trip_destination_temple_sunrise_1793359073972.jpg"
                : isTokyo
                ? "/src/assets/images/trip_destination_tokyo_night_1793359073470.jpg"
                : "/src/assets/images/trip_planner_hero_1793276374555.jpg";

              return (
                <motion.div
                  key={trip.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -12 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onSelectTrip(trip)}
                  className="group relative bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all cursor-pointer"
                >
                  {/* Card Header Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={coverImg} 
                      alt={trip.destination}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                    
                    <div className="absolute top-6 left-6">
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {trip.destination}
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                      <h3 className="text-2xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl">
                        {trip.name}
                      </h3>
                      {trip.status === 'completed' && (
                        <div className="bg-emerald-500 text-white p-2 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-2 gap-8 mb-10">
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Departure</p>
                        <p className="text-sm text-slate-700 font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500/50" />
                          {format(new Date(trip.startDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Utilization</p>
                        <p className="text-sm text-slate-900 font-black tabular-nums flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-500/50" />
                          {formatCurrency(trip.totalSpent || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end text-sm">
                        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Budget Progress</span>
                        <span className="text-slate-900 font-black tabular-nums">
                          {Math.min(Math.round(((trip.totalSpent || 0) / trip.budget) * 100), 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden ring-1 ring-slate-100">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(((trip.totalSpent || 0) / trip.budget) * 100, 100)}%` }}
                          className={cn(
                            "h-full rounded-full shadow-sm",
                            (trip.totalSpent || 0) > trip.budget ? "bg-red-500" : "bg-indigo-600"
                          )}
                        />
                      </div>
                    </div>

                    <div className="mt-10 flex items-center justify-between border-t border-slate-50 pt-8">
                      <div className="flex -space-x-3">
                        {['Me', ...(trip.coTravelers || [])].slice(0, 3).map((name, i) => (
                          <div 
                            key={i}
                            className="w-9 h-9 rounded-xl bg-slate-50 border-2 border-white flex items-center justify-center text-[11px] font-black text-slate-400 ring-1 ring-slate-100 shadow-sm"
                            title={name}
                          >
                            {name[0].toUpperCase()}
                          </div>
                        ))}
                        {(trip.coTravelers?.length || 0) > 2 && (
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 border-2 border-white flex items-center justify-center text-[11px] font-black text-white shadow-lg">
                            +{(trip.coTravelers?.length || 0) - 2}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500">
                        {trip.status === 'active' ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); completeTrip(trip.id); }}
                            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Complete"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); reactivateTrip(trip.id); }}
                            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Reactivate"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(trip); }}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); softDeleteTrip(trip.id); }}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Trip Modal */}
      {(showAddModal || editingTrip) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingTrip ? 'Edit Trip' : 'Plan New Journey'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTrip(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Trip Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Summer in Tokyo"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all placeholder:text-slate-300"
                  value={tripForm.name}
                  onChange={(e) => setTripForm({ ...tripForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Destination</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Tokyo, Japan"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all placeholder:text-slate-300"
                  value={tripForm.destination}
                  onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    value={tripForm.startDate}
                    onChange={(e) => setTripForm({ ...tripForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">End</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    value={tripForm.endDate}
                    onChange={(e) => setTripForm({ ...tripForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Budget</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-black text-lg transition-all tabular-nums"
                    value={tripForm.budget}
                    onChange={(e) => setTripForm({ ...tripForm, budget: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Co-Travelers</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add by name..."
                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all placeholder:text-slate-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !tripForm.coTravelers.includes(val)) {
                          setTripForm({ ...tripForm, coTravelers: [...tripForm.coTravelers, val] });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tripForm.coTravelers.map((name) => (
                    <span key={name} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest ring-1 ring-indigo-100">
                      {name}
                      <button
                        type="button"
                        onClick={() => setTripForm({ ...tripForm, coTravelers: tripForm.coTravelers.filter(n => n !== name) })}
                        className="text-indigo-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTrip(null);
                  }}
                  className="flex-1 py-4 text-slate-500 font-black hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
                >
                  {editingTrip ? 'UPDATE JOURNEY' : 'START PLANNING'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Trash Modal */}
      {showTrashModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                   <Trash2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recently Deleted</h2>
              </div>
              <button 
                onClick={() => setShowTrashModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {deletedTrips.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Info className="w-10 h-10 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold italic">No deleted journeys to recover.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {deletedTrips.map(trip => (
                    <div key={trip.id} className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl transition-all group">
                      <div>
                        <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{trip.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{trip.destination}</p>
                           <span className="w-1 h-1 bg-slate-200 rounded-full" />
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{format(new Date(trip.startDate), 'MMM yyyy')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => restoreTrip(trip.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest shadow-sm border border-slate-100 active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Deleted journeys can be restored anytime. All records are preserved.</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const CompassLarge = ({ className }: { className?: string }) => (
  <svg className={className} width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="2.5" />
    <path d="M16.2426 7.75736L13.4142 13.4142L7.75736 16.2426L10.5858 10.5858L16.2426 7.75736Z" fill="#6366F1" />
  </svg>
);
