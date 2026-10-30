# Security Specification - TripWise

## Data Invariants
1. A Trip must have a valid name, destination, budget, and dates.
2. A Trip belongs to exactly one user (the creator).
3. Expenses, Checklist Items, and Itinerary Items must belong to a valid Trip owned by the same user.
4. Timestamps (`createdAt`, `updatedAt`) must be server-generated.
5. The `userId` field must always match the authenticated user's UID.
6. Once a trip is marked as 'completed' or 'deleted', certain modifications should be restricted (terminal state locking).

## The "Dirty Dozen" Payloads

### 1. Identity Spoofing (Create Trip for others)
```json
{
  "name": "Hacker's Trip",
  "userId": "SOME_OTHER_UID",
  "isDeleted": false,
  "status": "active"
}
```

### 2. Privilege Escalation (Set self as Admin - if applicable)
```json
{
  "name": "Admin Trip",
  "isAdmin": true
}
```

### 3. Orphaned Resource (Create Expense for non-existent trip)
```json
{
  "tripId": "NON_EXISTENT_TRIP",
  "amount": 100,
  "category": "Food"
}
```

### 4. Cross-User Data Access (Create Expense for another user's trip)
```json
{
  "tripId": "OTHER_USER_TRIP_ID",
  "amount": 500,
  "category": "Shopping",
  "userId": "MY_UID"
}
```

### 5. Field Poisoning (Injecting ghost fields)
```json
{
  "name": "Ghost Trip",
  "ghostField": "I should not be here"
}
```

### 6. Immutability Violation (Modifying createdAt)
```json
{
  "createdAt": "2000-01-01T00:00:00Z"
}
```

### 7. Resource Exhaustion (Massive string injection)
```json
{
  "name": "A".repeat(10000)
}
```

### 8. Value Poisoning (Negative budget)
```json
{
  "budget": -1000
}
```

### 9. Type Mismatch (String instead of number)
```json
{
  "budget": "expensive"
}
```

### 10. Terminal State Bypassing (Modify completed trip)
```json
{
  "status": "completed",
  "budget": 999999
}
```

### 11. Unauthorized Deletion (Delete another user's trip)
`DELETE /trips/OTHER_USER_TRIP_ID`

### 12. List Scraping (Query trips without userId filter)
`GET /trips` (without where clause)

## Red Team Results
| Vulnerability | Status | Fix Applied |
| :--- | :--- | :--- |
| Identity Spoofing | Rejection Verified | `data.userId == request.auth.uid` |
| Orphaned Writes | Rejection Verified | `exists()` check on parent trip |
| Cross-User Writes | **FAIL** | Added `get().data.userId` check |
| Massive Strings | Rejection Verified | `.size() <= MAX` |
| Field Poisoning | Rejection Verified | `hasOnly()` on all writes |
