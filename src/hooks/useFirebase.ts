import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Trip, Expense, ChecklistItem, ItineraryItem, FirestoreErrorInfo } from '../types';
import { isAfter, parseISO, startOfDay } from 'date-fns';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useTrips(filter: 'active' | 'completed' | 'deleted' | 'all' = 'active') {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemo = new URLSearchParams(window.location.search).get('autostart') === '1';
    if (!auth.currentUser && !isDemo) return;

    if (isDemo || (auth.currentUser && auth.currentUser.uid === 'mock-user-123')) {
      setTrips([{
        id: 'mock-trip-1',
        name: 'Demo Trip to Tokyo',
        destination: 'Tokyo, Japan',
        startDate: '2026-11-01',
        endDate: '2026-11-10',
        budget: 50000,
        isDeleted: false,
        status: 'active',
        userId: 'mock-user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        totalSpent: 15000,
        totalTasks: 10,
        completedTasks: 4
      }]);
      setLoading(false);
      return;
    }

    const path = 'trips';
    const q = query(
      collection(db, path), 
      where('userId', '==', auth.currentUser?.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      async (snapshot) => {
        const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        const today = startOfDay(new Date());

        // Automatic completion logic - only for active trips
        const updates: Promise<void>[] = [];
        tripsData.forEach(trip => {
          if (!trip.isDeleted && (trip.status || 'active') === 'active' && trip.endDate && !trip.autoCompleteDisabled) {
            try {
              const endDate = startOfDay(parseISO(trip.endDate));
              if (isAfter(today, endDate)) {
                updates.push(updateDoc(doc(db, 'trips', trip.id), { status: 'completed', updatedAt: serverTimestamp() }));
              }
            } catch (e) {
              console.error('Error parsing date for trip:', trip.id, e);
            }
          }
        });

        if (updates.length > 0) {
          try {
            await Promise.all(updates);
          } catch (e) {
            console.error('Error auto-completing trips:', e);
          }
          return; // Listener will refire after updates
        }

        let filteredData = tripsData;
        if (filter === 'deleted') {
          filteredData = tripsData.filter(t => t.isDeleted === true);
        } else if (filter === 'all') {
          filteredData = tripsData.filter(t => !t.isDeleted);
        } else {
          filteredData = tripsData.filter(t => !t.isDeleted && (t.status || 'active') === filter);
        }
        
        setTrips(filteredData);
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );

    return unsubscribe;
  }, [filter]);

  const addTrip = async (tripData: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'status'>) => {
    if (!auth.currentUser) return;
    const path = 'trips';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...tripData,
        isDeleted: false,
        status: 'active',
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateTrip = async (tripId: string, tripData: Partial<Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    const path = `trips/${tripId}`;
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        ...tripData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const softDeleteTrip = async (tripId: string) => {
    await updateTrip(tripId, { isDeleted: true });
  };

  const restoreTrip = async (tripId: string) => {
    await updateTrip(tripId, { isDeleted: false });
  };

  const completeTrip = async (tripId: string) => {
    await updateTrip(tripId, { status: 'completed', autoCompleteDisabled: false });
  };

  const reactivateTrip = async (tripId: string) => {
    await updateTrip(tripId, { status: 'active', autoCompleteDisabled: true });
  };

  return { trips, loading, addTrip, updateTrip, softDeleteTrip, restoreTrip, completeTrip, reactivateTrip };
}

export function useTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemo = new URLSearchParams(window.location.search).get('autostart') === '1';
    if ((!auth.currentUser || !tripId) && !isDemo) return;

    if (isDemo || (auth.currentUser && auth.currentUser.uid === 'mock-user-123')) {
      setTrip({
        id: 'mock-trip-1',
        name: 'Demo Trip to Tokyo',
        destination: 'Tokyo, Japan',
        startDate: '2026-11-01',
        endDate: '2026-11-10',
        budget: 50000,
        isDeleted: false,
        status: 'active',
        userId: 'mock-user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        totalSpent: 15000,
        totalTasks: 10,
        completedTasks: 4,
        planningNotes: 'Hotel: Hilton Tokyo\nFlight: JL001',
        emergencyContacts: 'Local Police: 110\nAmbulance: 119'
      });
      setLoading(false);
      return;
    }

    const path = `trips/${tripId}`;
    const unsubscribe = onSnapshot(doc(db, 'trips', tripId), 
      (docSnap) => {
        if (docSnap.exists()) {
          setTrip({ id: docSnap.id, ...docSnap.data() } as Trip);
        }
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.GET, path)
    );

    return unsubscribe;
  }, [tripId]);

  const updateTrip = async (tripData: Partial<Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    if (!tripId) return;
    const path = `trips/${tripId}`;
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        ...tripData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return { trip, loading, updateTrip };
}


export function useExpenses(tripId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemo = new URLSearchParams(window.location.search).get('autostart') === '1';
    if ((!auth.currentUser || !tripId) && !isDemo) return;

    if (isDemo || (auth.currentUser && auth.currentUser.uid === 'mock-user-123')) {
      setExpenses([
        {
          id: 'e1',
          tripId: 'mock-trip-1',
          amount: 5000,
          category: 'Accommodation',
          date: '2026-11-01',
          description: 'Hotel Deposit',
          userId: 'mock-user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'e2',
          tripId: 'mock-trip-1',
          amount: 2000,
          category: 'Food',
          date: '2026-11-02',
          description: 'Sushi Dinner',
          userId: 'mock-user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      setLoading(false);
      return;
    }

    const path = 'expenses';
    const q = query(
      collection(db, path),
      where('tripId', '==', tripId),
      where('userId', '==', auth.currentUser?.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        setExpenses(expensesData);
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );

    return unsubscribe;
  }, [tripId]);

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!auth.currentUser) return;
    const path = 'expenses';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...expenseData,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateExpense = async (expenseId: string, expenseData: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    const path = `expenses/${expenseId}`;
    try {
      await updateDoc(doc(db, 'expenses', expenseId), {
        ...expenseData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    const path = `expenses/${expenseId}`;
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return { expenses, loading, addExpense, updateExpense, deleteExpense };
}

export function useChecklist(tripId?: string) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemo = new URLSearchParams(window.location.search).get('autostart') === '1';
    if ((!auth.currentUser || !tripId) && !isDemo) return;

    if (isDemo || (auth.currentUser && auth.currentUser.uid === 'mock-user-123')) {
      setItems([
        {
          id: 'c1',
          tripId: 'mock-trip-1',
          title: 'Buy Souvenirs',
          type: 'Shopping',
          isCompleted: false,
          userId: 'mock-user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'c2',
          tripId: 'mock-trip-1',
          title: 'Visit Senso-ji Temple',
          type: 'Place',
          isCompleted: true,
          userId: 'mock-user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ] as any);
      setLoading(false);
      return;
    }

    const path = 'checklistItems';
    const q = query(
      collection(db, path),
      where('tripId', '==', tripId),
      where('userId', '==', auth.currentUser?.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistItem));
        setItems(itemsData);
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );

    return unsubscribe;
  }, [tripId]);

  const addChecklistItem = async (itemData: Omit<ChecklistItem, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCompleted'>) => {
    if (!auth.currentUser) return;
    const path = 'checklistItems';
    try {
      await addDoc(collection(db, path), {
        ...itemData,
        isCompleted: false,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const toggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    const path = `checklistItems/${itemId}`;
    try {
      await updateDoc(doc(db, 'checklistItems', itemId), {
        isCompleted: !isCompleted,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteChecklistItem = async (itemId: string) => {
    const path = `checklistItems/${itemId}`;
    try {
      await deleteDoc(doc(db, 'checklistItems', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return { items, loading, addChecklistItem, toggleChecklistItem, deleteChecklistItem };
}

export function useItinerary(tripId?: string) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemo = new URLSearchParams(window.location.search).get('autostart') === '1';
    if ((!auth.currentUser || !tripId) && !isDemo) return;

    if (isDemo || (auth.currentUser && auth.currentUser.uid === 'mock-user-123')) {
      setItems([
        {
          id: 'i1',
          tripId: 'mock-trip-1',
          title: 'Arrive at Narita',
          date: '2026-11-01',
          time: '14:00',
          location: 'Narita Airport',
          userId: 'mock-user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'i2',
          tripId: 'mock-trip-1',
          title: 'Robot Restaurant',
          date: '2026-11-02',
          time: '19:00',
          location: 'Shinjuku',
          isCompleted: true,
          userId: 'mock-user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      setLoading(false);
      return;
    }

    const path = 'itineraryItems';
    const q = query(
      collection(db, path),
      where('tripId', '==', tripId),
      where('userId', '==', auth.currentUser?.uid),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryItem));
        setItems(itemsData);
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );

    return unsubscribe;
  }, [tripId]);

  const addItineraryItem = async (itemData: Omit<ItineraryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!auth.currentUser) return;
    const path = 'itineraryItems';
    try {
      await addDoc(collection(db, path), {
        ...itemData,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateItineraryItem = async (itemId: string, itemData: Partial<Omit<ItineraryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    const path = `itineraryItems/${itemId}`;
    try {
      await updateDoc(doc(db, 'itineraryItems', itemId), {
        ...itemData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteItineraryItem = async (itemId: string) => {
    const path = `itineraryItems/${itemId}`;
    try {
      await deleteDoc(doc(db, 'itineraryItems', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const toggleItineraryItem = async (itemId: string, isCompleted: boolean) => {
    const path = `itineraryItems/${itemId}`;
    try {
      await updateDoc(doc(db, 'itineraryItems', itemId), {
        isCompleted: !isCompleted,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return { items, loading, addItineraryItem, updateItineraryItem, deleteItineraryItem, toggleItineraryItem };
}
