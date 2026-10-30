export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  isDeleted: boolean;
  status: 'active' | 'completed';
  autoCompleteDisabled?: boolean;
  totalSpent?: number;
  totalTasks?: number;
  completedTasks?: number;
  coTravelers?: string[];
  planningNotes?: string;
  emergencyContacts?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export type ExpenseCategory = 'Food' | 'Transport' | 'Accommodation' | 'Activities' | 'Shopping' | 'Other';

export interface Expense {
  id: string;
  tripId: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  description?: string;
  photoUrl?: string;
  paidBy?: string;
  splitAmong?: string[];
  userId: string;
  isLoading?: boolean;
  createdAt: any;
  updatedAt: any;
}

export type ChecklistType = 'Activity' | 'Place' | 'Food' | 'Other' | 'Packing';

export interface ChecklistItem {
  id: string;
  tripId: string;
  title: string;
  type: ChecklistType;
  isCompleted: boolean;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  isCompleted?: boolean;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}
