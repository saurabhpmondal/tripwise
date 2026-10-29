import React, { useState, useMemo } from 'react';
import { Trip, Expense, ExpenseCategory } from '../types';
import { useExpenses } from '../hooks/useFirebase';
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
  List as ListIcon
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

export const TripDetail: React.FC<TripDetailProps> = ({ trip, onBack }) => {
  const { expenses, loading, addExpense, deleteExpense } = useExpenses(trip.id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    category: 'Food' as ExpenseCategory,
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    tripId: trip.id
  });

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const remainingBudget = trip.budget - totalSpent;
  const progressPercent = Math.min((totalSpent / trip.budget) * 100, 100);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExpense(newExpense);
    setShowAddModal(false);
    setNewExpense({
      amount: 0,
      category: 'Food',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      tripId: trip.id
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Trips</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trip Info & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{trip.name}</h1>
            <p className="text-slate-500 mb-6">{trip.destination}</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 font-medium">Budget Progress</span>
                  <span className={cn(
                    "font-bold",
                    remainingBudget < 0 ? "text-red-600" : "text-indigo-600"
                  )}>
                    {formatCurrency(totalSpent)} / {formatCurrency(trip.budget)}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className={cn(
                      "h-full rounded-full",
                      remainingBudget < 0 ? "bg-red-500" : "bg-indigo-600"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Spent</p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Remaining</p>
                  <p className={cn(
                    "text-lg font-bold tabular-nums",
                    remainingBudget < 0 ? "text-red-600" : "text-slate-900"
                  )}>
                    {formatCurrency(remainingBudget)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Category Breakdown</h3>
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
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-10 text-sm italic">Add expenses to see breakdown</p>
            )}
          </div>
        </div>

        {/* Right Column: Expense List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <ListIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'chart' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <PieIcon className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {expenses.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-slate-400 italic">No expenses recorded for this trip.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <AnimatePresence initial={false}>
                  {expenses.map((expense) => {
                    const Icon = CATEGORY_ICONS[expense.category];
                    return (
                      <motion.div
                        key={expense.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-4 flex items-center gap-4 group hover:bg-slate-50 transition-colors"
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}20`, color: CATEGORY_COLORS[expense.category] }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{expense.description}</p>
                          <p className="text-xs text-slate-500">{expense.category} · {format(new Date(expense.date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(expense.amount)}</span>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Expense</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none tabular-nums"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewExpense({ ...newExpense, category: cat })}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs",
                          newExpense.category === cat
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                            : "border-slate-100 hover:border-slate-200 text-slate-600"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="Dinner at Ichiran"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
