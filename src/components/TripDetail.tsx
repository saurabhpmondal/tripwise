import React, { useState, useMemo, useRef } from 'react';
import { Trip, Expense, ExpenseCategory, ChecklistItem, ChecklistType, ItineraryItem } from '../types';
import { useExpenses, useChecklist, useTrips, useItinerary, useTrip } from '../hooks/useFirebase';
import { uploadToDrive } from '../lib/drive';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Utensils, 
  Car, 
  Home, 
  Camera, 
  ShoppingBag, 
  Tag, 
  ChevronDown,
  PieChart as PieIcon,
  List as ListIcon,
  CheckSquare,
  Square,
  Map,
  Activity,
  Coffee,
  AlertCircle,
  Edit3,
  X,
  Image as ImageIcon,
  Upload,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  BookOpen,
  Phone,
  StickyNote,
  RotateCcw,
  Wallet,
  MapPin
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TripDetailProps {
  trip: Trip;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ElementType> = {
  Food: Utensils,
  Transport: Car,
  Accommodation: Home,
  Activities: Camera,
  Shopping: ShoppingBag,
  Other: Tag,
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#F59E0B', // Amber
  Transport: '#3B82F6', // Blue
  Accommodation: '#10B981', // Emerald
  Activities: '#8B5CF6', // Violet
  Shopping: '#EC4899', // Pink
  Other: '#64748B', // Slate
};

const CHECKLIST_ICONS: Record<ChecklistType, React.ElementType> = {
  Activity: Activity,
  Place: Map,
  Food: Coffee,
  Packing: ShoppingBag,
  Other: Tag,
};

export const TripDetail: React.FC<TripDetailProps> = ({ trip: initialTrip, onBack }) => {
  const { trip, loading: tripLoading, updateTrip } = useTrip(initialTrip.id);
  const currentTrip = trip || initialTrip;

  const { expenses, loading: expensesLoading, addExpense, updateExpense, deleteExpense } = useExpenses(currentTrip.id);
  const { items: checklistItems, loading: checklistLoading, addChecklistItem, toggleChecklistItem, deleteChecklistItem } = useChecklist(currentTrip.id);
  
  const [activeTab, setActiveTab] = useState<'expenses' | 'checklist' | 'itinerary' | 'planning'>('expenses');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<ItineraryItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items: itineraryItems, addItineraryItem, updateItineraryItem, deleteItineraryItem, toggleItineraryItem } = useItinerary(currentTrip.id);

  const [expenseForm, setExpenseForm] = useState<{
    amount: number;
    category: ExpenseCategory;
    date: string;
    description: string;
    photoUrl: string;
    paidBy: string;
    splitAmong: string[];
    tripId: string;
  }>({
    amount: 0,
    category: 'Food',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    photoUrl: '',
    paidBy: '',
    splitAmong: [] as string[],
    tripId: currentTrip.id
  });

  const PACKING_TEMPLATE = [
    { title: 'Passport/ID', type: 'Packing' as ChecklistType },
    { title: 'Travel Insurance', type: 'Packing' as ChecklistType },
    { title: 'Phone Charger', type: 'Packing' as ChecklistType },
    { title: 'Power Bank', type: 'Packing' as ChecklistType },
    { title: 'Toiletries', type: 'Packing' as ChecklistType },
    { title: 'First Aid Kit', type: 'Packing' as ChecklistType },
    { title: 'Weather-appropriate Clothes', type: 'Packing' as ChecklistType },
    { title: 'Comfortable Shoes', type: 'Packing' as ChecklistType },
  ];

  const [newChecklistItem, setNewChecklistItem] = useState({
    title: '',
    type: 'Activity' as ChecklistType,
    tripId: currentTrip.id
  });

  const [editTripForm, setEditTripForm] = useState({
    name: currentTrip.name,
    destination: currentTrip.destination,
    startDate: currentTrip.startDate,
    endDate: currentTrip.endDate,
    budget: currentTrip.budget
  });

  // Sync form when trip data changes
  React.useEffect(() => {
    if (trip) {
      setEditTripForm({
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget
      });
    }
  }, [trip]);

  const [itineraryForm, setItineraryForm] = useState({
    title: '',
    date: currentTrip.startDate,
    time: '12:00',
    location: '',
    notes: '',
    tripId: currentTrip.id
  });

  const [planningForm, setPlanningForm] = useState({
    planningNotes: currentTrip.planningNotes || '',
    emergencyContacts: currentTrip.emergencyContacts || ''
  });

  const [isSavingPlanning, setIsSavingPlanning] = useState(false);

  // Sync planning form when trip data changes
  React.useEffect(() => {
    if (trip) {
      setPlanningForm({
        planningNotes: trip.planningNotes || '',
        emergencyContacts: trip.emergencyContacts || ''
      });
    }
  }, [trip]);

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const remainingBudget = currentTrip.budget - totalSpent;
  const progressPercent = Math.min((totalSpent / currentTrip.budget) * 100, 100);
  const isOverBudget = totalSpent > currentTrip.budget;

  const checklistStats = useMemo(() => {
    const completed = checklistItems.filter(item => item.isCompleted).length;
    const total = checklistItems.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [checklistItems]);

  const chartData = useMemo(() => {
    const data: Record<string, { name: string, value: number, fill: string }> = {};
    expenses.forEach(e => {
      if (!data[e.category]) {
        data[e.category] = { name: e.category, value: 0, fill: CATEGORY_COLORS[e.category] };
      }
      data[e.category].value += e.amount;
    });
    return Object.values(data);
  }, [expenses]);
  
  // Sync stats to trip document for dashboard visibility
  React.useEffect(() => {
    if (currentTrip.id && !expensesLoading && !checklistLoading) {
      const needsUpdate = 
        currentTrip.totalSpent !== totalSpent || 
        currentTrip.totalTasks !== checklistStats.total || 
        currentTrip.completedTasks !== checklistStats.completed;
      
      if (needsUpdate) {
        // Use a timeout to debounce updates
        const timer = setTimeout(() => {
          updateTrip({
            totalSpent,
            totalTasks: checklistStats.total,
            completedTasks: checklistStats.completed
          });
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [totalSpent, checklistStats, currentTrip.id, expensesLoading, checklistLoading]);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    // Ensure amount is a valid number and never NaN
    const amount = isNaN(expenseForm.amount) ? 0 : expenseForm.amount;

    // Optimistic data for the initial Firestore save
    const initialFirestoreData = { 
      ...expenseForm, 
      amount,
      photoUrl: selectedFile ? (editingExpense?.photoUrl || '') : expenseForm.photoUrl,
      isLoading: !!selectedFile 
    };

    try {
      let expenseId = '';
      
      if (editingExpense) {
        expenseId = editingExpense.id;
        await updateExpense(expenseId, initialFirestoreData);
      } else {
        // Immediate save to Firestore
        const newId = await addExpense(initialFirestoreData);
        if (newId) expenseId = newId;
      }

      if (!selectedFile) {
        setShowExpenseModal(false);
        resetExpenseForm();
        setIsUploading(false);
        setEditingExpense(null);
        return;
      }

      setShowExpenseModal(false); 
      
      const drivePhotoUrl = await uploadToDrive(selectedFile);
      
      await updateExpense(expenseId, { 
        ...expenseForm, 
        amount, 
        photoUrl: drivePhotoUrl, 
        isLoading: false 
      });
      
      resetExpenseForm();
      setEditingExpense(null);
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Error saving expense or uploading photo. Please check your internet connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      amount: 0,
      category: 'Food',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      photoUrl: '',
      paidBy: currentTrip.coTravelers?.[0] || '',
      splitAmong: currentTrip.coTravelers || [],
      tripId: currentTrip.id
    });
    setSelectedFile(null);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      description: expense.description || '',
      photoUrl: expense.photoUrl || '',
      paidBy: expense.paidBy || '',
      splitAmong: expense.splitAmong || [],
      tripId: expense.tripId
    });
    setShowExpenseModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setExpenseForm(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChecklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addChecklistItem(newChecklistItem);
    setShowAddChecklistModal(false);
    setNewChecklistItem({
      title: '',
      type: 'Activity',
      tripId: currentTrip.id
    });
  };

  const loadPackingTemplate = async () => {
    const existingTitles = new Set(checklistItems.map(i => i.title.toLowerCase()));
    const itemsToAdd = PACKING_TEMPLATE.filter(item => !existingTitles.has(item.title.toLowerCase()));
    
    if (itemsToAdd.length === 0) return;
    
    const promises = itemsToAdd.map(item => addChecklistItem({ ...item, tripId: currentTrip.id }));
    await Promise.all(promises);
  };

  const handleEditTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTrip(editTripForm);
    setShowEditTripModal(false);
  };

  const handleItinerarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItinerary) {
      await updateItineraryItem(editingItinerary.id, itineraryForm);
      setEditingItinerary(null);
    } else {
      await addItineraryItem(itineraryForm);
    }
    setShowItineraryModal(false);
    setItineraryForm({
      title: '',
      date: currentTrip.startDate,
      time: '12:00',
      location: '',
      notes: '',
      tripId: currentTrip.id
    });
  };

  const openEditItinerary = (item: ItineraryItem) => {
    setEditingItinerary(item);
    setItineraryForm({
      title: item.title,
      date: item.date,
      time: item.time || '12:00',
      location: item.location || '',
      notes: item.notes || '',
      tripId: item.tripId
    });
    setShowItineraryModal(true);
  };

  const handlePlanningSave = async () => {
    setIsSavingPlanning(true);
    try {
      await updateTrip(planningForm);
    } catch (error) {
      console.error('Failed to save planning data:', error);
    } finally {
      setIsSavingPlanning(false);
    }
  };

  const isMathura = currentTrip.destination.toLowerCase().includes('mathura');
  const isTokyo = currentTrip.destination.toLowerCase().includes('tokyo');
  const coverImg = isMathura 
    ? "/src/assets/images/trip_destination_temple_sunrise_1793359073972.jpg"
    : isTokyo
    ? "/src/assets/images/trip_destination_tokyo_night_1793359073470.jpg"
    : "/src/assets/images/trip_planner_hero_1793276374555.jpg";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Visual Hero Header */}
      <div className="relative h-96 w-full overflow-hidden">
        <img src={coverImg} className="w-full h-full object-cover" alt={currentTrip.destination} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-12 max-w-7xl mx-auto w-full">
          <button
            onClick={onBack}
            className="absolute top-8 left-12 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Back to Dashboard</span>
          </button>

          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-[0.2em]">
                <MapPin className="w-3.5 h-3.5" />
                {currentTrip.destination}
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{currentTrip.name}</h1>
              <div className="flex items-center gap-6 text-slate-300 text-sm font-bold">
                <span className="flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-400" /> {format(new Date(currentTrip.startDate), 'MMM d')} - {format(new Date(currentTrip.endDate), 'MMM d, yyyy')}</span>
                <span className="w-1.5 h-1.5 bg-slate-500/50 rounded-full" />
                <span className="flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-400" /> {formatCurrency(currentTrip.budget)} Budget</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowEditTripModal(true)}
                className="p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/10 hover:bg-white/20 transition-all shadow-2xl active:scale-95"
              >
                <Edit3 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-12 -mt-12 relative z-10 space-y-12">
        {/* Key Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col justify-between h-44 group hover:shadow-2xl hover:border-indigo-100 transition-all">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className={cn("text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider", isOverBudget ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                {progressPercent.toFixed(0)}% Used
              </span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Spent</p>
              <h3 className="text-3xl font-black text-slate-900 tabular-nums">{formatCurrency(totalSpent)}</h3>
            </div>
          </div>

          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col justify-between h-44 group hover:shadow-2xl hover:border-emerald-100 transition-all">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-3 py-1 bg-slate-50 text-slate-600 rounded-full uppercase tracking-wider">
                {checklistStats.percent}% Done
              </span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Tasks Completed</p>
              <h3 className="text-3xl font-black text-slate-900 tabular-nums">{checklistStats.completed} / {checklistStats.total}</h3>
            </div>
          </div>

          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col justify-between h-44 group hover:shadow-2xl transition-all">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Remaining</p>
              <h3 className={cn("text-3xl font-black tabular-nums", isOverBudget ? "text-red-600" : "text-slate-900")}>
                {formatCurrency(remainingBudget)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col justify-between h-44 group hover:shadow-2xl transition-all">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Status</p>
              <h3 className="text-3xl font-black text-slate-900 capitalize">{currentTrip.status}</h3>
            </div>
          </div>
        </div>

        {currentTrip.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full -mr-32 -mt-32" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-2xl border border-white/10">
                  <CheckCircle2 className="w-12 h-12 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tight">Trip Completed!</h2>
                  <p className="text-slate-400 font-bold text-lg">You've successfully explored {currentTrip.destination}.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
                <div className="text-center">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">Final Spend</p>
                  <p className="text-4xl font-black tabular-nums text-white">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">Completion</p>
                  <p className="text-4xl font-black tabular-nums text-white">{checklistStats.percent}%</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">Budget Status</p>
                  <p className={cn("text-4xl font-black", isOverBudget ? "text-red-400" : "text-emerald-400")}>{isOverBudget ? 'Over' : 'Under'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60 w-full sm:w-auto">
                {[
                  { id: 'expenses', label: 'Expenses', icon: Wallet },
                  { id: 'itinerary', label: 'Itinerary', icon: Map },
                  { id: 'checklist', label: 'Checklist', icon: ListIcon },
                  { id: 'planning', label: 'Planning', icon: BookOpen }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold rounded-xl transition-all",
                      activeTab === tab.id ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                {activeTab === 'expenses' ? (
                  <button
                    onClick={() => { setEditingExpense(null); resetExpenseForm(); setShowExpenseModal(true); }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Expense</span>
                  </button>
                ) : activeTab === 'checklist' ? (
                  <button
                    onClick={() => setShowAddChecklistModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Task</span>
                  </button>
                ) : activeTab === 'itinerary' ? (
                  <button
                    onClick={() => { setEditingItinerary(null); setShowItineraryModal(true); }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Plan</span>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 rounded-[3rem] shadow-sm overflow-hidden min-h-[500px]">
              {activeTab === 'expenses' ? (
                expenses.length === 0 ? (
                  <div className="py-32 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Wallet className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold italic">No expenses recorded for this trip.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    <AnimatePresence initial={false} mode="popLayout">
                      {expenses.map((expense) => {
                        const Icon = CATEGORY_ICONS[expense.category];
                        return (
                          <motion.div
                            key={expense.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6 flex items-center gap-6 group hover:bg-slate-50 transition-all"
                          >
                            <div 
                              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                              style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}15`, color: CATEGORY_COLORS[expense.category] }}
                            >
                              <Icon className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-black text-slate-900 truncate text-lg">
                                  {expense.category}
                                </p>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{format(new Date(expense.date), 'dd MMM')}</span>
                              </div>
                              <p className="text-sm font-medium text-slate-500 truncate">
                                {expense.description || "No description provided"}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                {expense.photoUrl && (
                                  <button 
                                    onClick={() => setPreviewPhoto(expense.photoUrl!)}
                                    className="flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md transition-all"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>VIEW BILL</span>
                                  </button>
                                )}
                                {expense.paidBy && (
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">PAID BY: {expense.paidBy}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-6">
                              {expense.isLoading ? (
                                <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">
                                  <span className="text-xs font-black animate-pulse">UPLOADING...</span>
                                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              ) : (
                                <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{formatCurrency(expense.amount)}</span>
                              )}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button
                                  onClick={() => openEditExpense(expense)}
                                  className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all"
                                  title="Edit"
                                >
                                  <Edit3 className="w-4.5 h-4.5" />
                                </button>
                                <button
                                  onClick={() => deleteExpense(expense.id)}
                                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl shadow-sm transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              ) : activeTab === 'checklist' ? (
                checklistItems.length === 0 ? (
                  <div className="py-32 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <ListIcon className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold italic">Your checklist is empty.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {/* Active Items */}
                    <div className="p-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        Active Tasks
                      </h4>
                      {checklistItems.filter(i => !i.isCompleted).length === 0 ? (
                        <div className="py-12 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                          <CheckCircle2 className="w-8 h-8 text-slate-200 mb-2" />
                          <p className="text-sm text-slate-400 font-bold italic">All caught up!</p>
                        </div>
                      ) : (
                        <AnimatePresence initial={false} mode="popLayout">
                          {checklistItems.filter(i => !i.isCompleted).map((item) => {
                            const Icon = CHECKLIST_ICONS[item.type];
                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="p-5 mb-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-5 group hover:shadow-xl hover:border-indigo-100 transition-all"
                              >
                                <button 
                                  onClick={() => toggleChecklistItem(item.id, item.isCompleted)}
                                  className="shrink-0 text-slate-200 hover:text-indigo-500 transition-all hover:scale-110"
                                >
                                  <Square className="w-8 h-8" />
                                </button>
                                
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                  <Icon className="w-6 h-6" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{item.title}</p>
                                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.type}</p>
                                </div>
                                
                                <div className="text-right">
                                  <button
                                    onClick={() => deleteChecklistItem(item.id)}
                                    className="p-2.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      )}
                    </div>

                    {/* Completed Items */}
                    <div className="p-8 bg-slate-50/30">
                      <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Recently Finished
                      </h4>
                      {checklistItems.filter(i => i.isCompleted).length === 0 ? (
                        <p className="text-sm text-slate-300 font-bold italic py-4">Nothing completed yet</p>
                      ) : (
                        <AnimatePresence initial={false} mode="popLayout">
                          {checklistItems.filter(i => i.isCompleted).map((item) => {
                            const Icon = CHECKLIST_ICONS[item.type];
                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-4 mb-3 bg-white/40 border border-transparent rounded-2xl flex items-center gap-5 group grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all"
                              >
                                <button 
                                  onClick={() => toggleChecklistItem(item.id, item.isCompleted)}
                                  className="shrink-0 text-emerald-500 hover:scale-110 transition-all"
                                >
                                  <CheckSquare className="w-8 h-8" />
                                </button>
                                
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white text-slate-300 group-hover:text-emerald-500 transition-all">
                                  <Icon className="w-5 h-5" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-400 line-through text-base">{item.title}</p>
                                  <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">{item.type}</p>
                                </div>
                                
                                <div className="text-right">
                                  <button
                                    onClick={() => deleteChecklistItem(item.id)}
                                    className="p-2 text-slate-200 hover:text-red-400 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                )
              ) : activeTab === 'itinerary' ? (
                itineraryItems.length === 0 ? (
                  <div className="py-32 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Map className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold italic">No itinerary planned yet.</p>
                  </div>
                ) : (
                  <div className="p-10 space-y-12">
                    {/* Group itinerary by date */}
                    {Array.from(new Set(itineraryItems.map(item => item.date))).sort().map(date => (
                      <div key={date} className="relative pl-12 border-l-4 border-slate-100 last:border-l-0 pb-10">
                        <div className="absolute -left-[10px] top-0 w-[16px] h-[16px] rounded-full bg-slate-900 border-4 border-white shadow-md shadow-slate-200" />
                        <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                          <Calendar className="w-6 h-6 text-indigo-600" />
                          {format(new Date(date), 'EEEE, MMMM d')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {itineraryItems
                            .filter(item => item.date === date)
                            .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                            .map(item => (
                              <div key={item.id} className={cn(
                                "bg-slate-50/50 border border-slate-100/50 rounded-3xl p-6 flex items-start gap-6 group hover:bg-white hover:shadow-2xl hover:border-indigo-100 transition-all",
                                item.isCompleted && "opacity-50"
                              )}>
                                <div className="shrink-0 pt-1">
                                  <button 
                                    onClick={() => toggleItineraryItem(item.id, !!item.isCompleted)}
                                    className={cn(
                                      "transition-all hover:scale-110",
                                      item.isCompleted ? "text-emerald-500" : "text-slate-200 hover:text-indigo-400"
                                    )}
                                  >
                                    {item.isCompleted ? <CheckCircle2 className="w-7 h-7" /> : <Square className="w-7 h-7" />}
                                  </button>
                                </div>
                                <div className="shrink-0 w-16 text-center space-y-1 pt-0.5">
                                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2">
                                    <Clock className="w-6 h-6" />
                                  </div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter tabular-nums">{item.time}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className={cn("text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors", item.isCompleted && "line-through")}>{item.title}</h5>
                                  {item.location && (
                                    <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5 mt-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                                      <MapPin className="w-4 h-4 text-indigo-400" />
                                      {item.location}
                                    </p>
                                  )}
                                  {item.notes && (
                                    <div className="mt-4 p-4 bg-white/60 rounded-2xl border-l-4 border-indigo-200">
                                      <p className="text-sm font-medium text-slate-600 italic">"{item.notes}"</p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                  <button
                                    onClick={() => openEditItinerary(item)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                  >
                                    <Edit3 className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => deleteItineraryItem(item.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === 'planning' ? (
                <div className="p-10 space-y-12">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <StickyNote className="w-6 h-6" />
                        </div>
                        General Notes & Planning
                      </h3>
                      <button
                        onClick={handlePlanningSave}
                        disabled={isSavingPlanning}
                        className="px-8 py-3 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                      >
                        {isSavingPlanning ? 'SAVING...' : 'SAVE CHANGES'}
                      </button>
                    </div>
                    <textarea
                      className="w-full h-80 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none text-slate-700 font-medium transition-all"
                      placeholder="Flights, hotel details, confirmation numbers, or general trip notes..."
                      value={planningForm.planningNotes}
                      onChange={(e) => setPlanningForm({ ...planningForm, planningNotes: e.target.value })}
                    />
                  </div>

                  <div className="pt-10 border-t border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
                      <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                        <Phone className="w-6 h-6" />
                      </div>
                      Emergency Contacts & Resources
                    </h3>
                    <textarea
                      className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-2 focus:ring-red-500 focus:bg-white outline-none resize-none text-slate-700 font-medium transition-all"
                      placeholder="Local emergency numbers, insurance policy details, embassy contact..."
                      value={planningForm.emergencyContacts}
                      onChange={(e) => setPlanningForm({ ...planningForm, emergencyContacts: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100">
                    <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100/50 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                      <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <h4 className="text-lg font-black text-indigo-950 mb-2 tracking-tight">Travel Guide</h4>
                      <p className="text-indigo-700/70 font-medium leading-relaxed">Check visa requirements and local customs for {currentTrip.destination} before departure.</p>
                    </div>
                    <div className="bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100/50 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                      <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-7 h-7" />
                      </div>
                      <h4 className="text-lg font-black text-amber-950 mb-2 tracking-tight">Security Protocol</h4>
                      <p className="text-amber-700/70 font-medium leading-relaxed">Upload a scan of your passport to your Google Drive for secure access anywhere.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Column: Mini Bento Stats */}
          <div className="space-y-8">
            <div className="bg-white border border-slate-200/60 rounded-[3rem] p-8 shadow-sm group hover:shadow-2xl transition-all">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Spending Analytics</h3>
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                  <PieIcon className="w-5 h-5" />
                </div>
              </div>
              {expenses.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px 24px' }}
                        itemStyle={{ fontWeight: 900, fontSize: '14px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold italic text-sm">No data to display</p>
                </div>
              )}
              
              <div className="mt-8 space-y-3">
                {chartData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {activeTab === 'checklist' && (
              <div className="bg-emerald-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20 transition-all group-hover:scale-150" />
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md mx-auto ring-1 ring-white/20">
                    <ShoppingBag className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Need a head start?</h3>
                  <p className="text-emerald-50/70 font-bold text-sm mb-10 leading-relaxed px-4">Load our essential packing template and get ready in seconds.</p>
                  <button
                    onClick={loadPackingTemplate}
                    className="w-full py-5 bg-white text-emerald-700 rounded-2xl font-black text-sm hover:bg-emerald-50 transition-all shadow-xl active:scale-95"
                  >
                    LOAD ESSENTIALS
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full -mr-20 -mb-20" />
               <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black tracking-tight">Smart Insights</h3>
                  <div className="p-2 bg-white/10 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-all">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Average Daily Spend</p>
                    <p className="text-3xl font-black tabular-nums text-white tracking-tighter">
                      {expenses.length > 0 ? formatCurrency(totalSpent / expenses.length) : formatCurrency(0)}
                    </p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-all">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Remaining Tasks</p>
                    <p className="text-3xl font-black tabular-nums text-white tracking-tighter">
                      {checklistItems.filter(i => !i.isCompleted).length} <span className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">PENDING</span>
                    </p>
                  </div>
                </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Trip Modal */}
      {showEditTripModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Journey</h2>
              <button onClick={() => setShowEditTripModal(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditTripSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Trip Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  value={editTripForm.name}
                  onChange={(e) => setEditTripForm({ ...editTripForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Destination</label>
                <input
                  type="text"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  value={editTripForm.destination}
                  onChange={(e) => setEditTripForm({ ...editTripForm, destination: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    value={editTripForm.startDate}
                    onChange={(e) => setEditTripForm({ ...editTripForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    value={editTripForm.endDate}
                    onChange={(e) => setEditTripForm({ ...editTripForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total Budget</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-black text-lg transition-all tabular-nums"
                    value={editTripForm.budget}
                    onChange={(e) => setEditTripForm({ ...editTripForm, budget: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditTripModal(false)}
                  className="flex-1 py-4 text-slate-500 font-black hover:text-slate-900 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                  UPDATE TRIP
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingExpense ? 'Modify Expense' : 'Log New Expense'}
              </h2>
              <button onClick={() => setShowExpenseModal(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">₹</span>
                  <input
                    type="number"
                    required
                    step="1"
                    min="0"
                    placeholder="0"
                    className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-black text-2xl transition-all tabular-nums"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setExpenseForm({ ...expenseForm, category: cat })}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                          expenseForm.category === cat
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02]"
                            : "bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-100 text-slate-600"
                        )}
                      >
                        <Icon className={cn("w-6 h-6", expenseForm.category === cat ? "text-white" : "text-indigo-600")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Receipt</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full h-[58px] flex items-center justify-center gap-2 px-4 border rounded-2xl transition-all font-bold text-sm shadow-sm",
                      expenseForm.photoUrl ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-white"
                    )}
                  >
                    {expenseForm.photoUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Upload className="w-4 h-4 text-indigo-500" />}
                    <span>{expenseForm.photoUrl ? 'CAPTURED' : 'UPLOAD'}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                <input
                  type="text"
                  placeholder="Dinner at Ichiran, Souvenirs, etc."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all placeholder:text-slate-300"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                />
              </div>

              {currentTrip.coTravelers && currentTrip.coTravelers.length > 0 && (
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Split Configuration</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Who paid?</label>
                    <select
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none cursor-pointer"
                      value={expenseForm.paidBy}
                      onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                    >
                      <option value="">Select person</option>
                      {['Me', ...currentTrip.coTravelers].map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Split with:</label>
                    <div className="flex flex-wrap gap-2">
                      {['Me', ...currentTrip.coTravelers].map(name => (
                        <label 
                          key={name} 
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black cursor-pointer transition-all uppercase tracking-widest shadow-sm",
                            expenseForm.splitAmong.includes(name) 
                              ? "bg-indigo-600 border-indigo-600 text-white scale-105" 
                              : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={expenseForm.splitAmong.includes(name)}
                            onChange={(e) => {
                              const newSplit = e.target.checked 
                                ? [...expenseForm.splitAmong, name]
                                : expenseForm.splitAmong.filter(n => n !== name);
                              setExpenseForm({ ...expenseForm, splitAmong: newSplit });
                            }}
                          />
                          <span>{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 pt-6 sticky bottom-0 bg-white pb-2 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-4 text-slate-500 font-black hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  {isUploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editingExpense ? 'UPDATE LOG' : 'SAVE EXPENSE'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Itinerary Modal */}
      {showItineraryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingItinerary ? 'Update Event' : 'Add New Event'}
              </h2>
              <button onClick={() => setShowItineraryModal(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleItinerarySubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Visit Taj Mahal"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all placeholder:text-slate-300"
                  value={itineraryForm.title}
                  onChange={(e) => setItineraryForm({ ...itineraryForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input
                    type="date"
                    required
                    min={currentTrip.startDate}
                    max={currentTrip.endDate}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    value={itineraryForm.date}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                  <input
                    type="time"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    value={itineraryForm.time}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="E.g. Agra, Uttar Pradesh"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold transition-all placeholder:text-slate-300"
                    value={itineraryForm.location}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Extra Details</label>
                <textarea
                  placeholder="Don't forget the camera!"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none h-28 font-medium transition-all placeholder:text-slate-300"
                  value={itineraryForm.notes}
                  onChange={(e) => setItineraryForm({ ...itineraryForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowItineraryModal(false)}
                  className="flex-1 py-4 text-slate-500 font-black hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
                >
                  {editingItinerary ? 'UPDATE PLAN' : 'ADD TO PLAN'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl cursor-zoom-out"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img 
                src={previewPhoto.includes('drive.google.com') && !previewPhoto.includes('thumbnail') 
                  ? previewPhoto.replace(/\/view.*$/, '').replace('/file/d/', '/thumbnail?id=') + '&sz=w1200'
                  : previewPhoto
                } 
                alt="Bill Preview" 
                className="rounded-3xl shadow-2xl max-w-full max-h-[75vh] object-contain border-8 border-white/5 ring-1 ring-white/10"
                onError={(e) => {
                  if (previewPhoto.includes('drive.google.com')) {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Please+use+the+link+below+to+view+in+Drive';
                  }
                }}
              />
              <button 
                className="absolute -top-16 right-0 p-4 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 backdrop-blur-md"
                onClick={() => setPreviewPhoto(null)}
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <div className="flex gap-6 relative z-10">
              <button
                onClick={() => setPreviewPhoto(null)}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-black transition-all border border-white/10 backdrop-blur-md uppercase tracking-widest"
              >
                CLOSE PREVIEW
              </button>
              {previewPhoto.includes('drive.google.com') && (
                <a 
                  href={previewPhoto.includes('thumbnail') 
                    ? `https://drive.google.com/file/d/${new URLSearchParams(previewPhoto.split('?')[1]).get('id')}/view`
                    : previewPhoto
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black flex items-center gap-3 shadow-2xl transition-all active:scale-95 uppercase tracking-widest"
                >
                  <Eye className="w-5 h-5" />
                  <span>VIEW FULL IN DRIVE</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Checklist Modal */}
      {showAddChecklistModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Task</h2>
              <button onClick={() => setShowAddChecklistModal(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleChecklistSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Task Description</label>
                <input
                  type="text"
                  required
                  placeholder="Visit Shibuya Crossing, Pack Sunscreen, etc."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold transition-all"
                  value={newChecklistItem.title}
                  onChange={(e) => setNewChecklistItem({ ...newChecklistItem, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(CHECKLIST_ICONS) as ChecklistType[]).map((type) => {
                    const Icon = CHECKLIST_ICONS[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewChecklistItem({ ...newChecklistItem, type })}
                        className={cn(
                          "flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all font-bold text-sm uppercase tracking-widest",
                          newChecklistItem.type === type
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-lg"
                            : "bg-slate-50 border-slate-100 hover:bg-white hover:border-emerald-100 text-slate-600"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", newChecklistItem.type === type ? "text-white" : "text-emerald-600")} />
                        <span>{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddChecklistModal(false)}
                  className="flex-1 py-4 text-slate-500 font-black hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
                >
                  ADD TO LIST
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
