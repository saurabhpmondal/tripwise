export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
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
  description: string;
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
