# Security Specification - TripWise

## Data Invariants
1. A Trip must belong to a valid authenticated user (`userId`).
2. An Expense must be linked to a `tripId` and its `userId` must match the requester.
3. Users can only read/write their own trips and expenses.
4. Timestamps (`createdAt`, `updatedAt`) must be server-validated.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Create a trip with someone else's `userId`.
2. **Orphaned Expense**: Create an expense for a non-existent `tripId`.
3. **Budget Poisoning**: Update trip budget to a negative value.
4. **Massive Payload**: Send a 1MB string in trip description.
5. **Unauthorized Read**: Try to list trips of another user.
6. **Cross-User Update**: Try to update an expense belonging to another user.
7. **Cross-User Delete**: Try to delete a trip belonging to another user.
8. **Shadow Field Injection**: Add `isAdmin: true` to a Trip document.
9. **Timestamp Manipulation**: Set `createdAt` to a future date from the client.
10. **Category Injection**: Set expense category to "IllegalStuff".
11. **Document ID Poisoning**: Use a 2KB string as a trip document ID.
12. **Double Spend (Atomic Sync)**: Attempt to add an expense without the `updatedAt` field update.

## Test Runner Plan
- Use `firestore.rules.test.ts` to simulate these attacks using the Firebase emulator or test environment.
- Verify `PERMISSION_DENIED` for all malicious attempts.
