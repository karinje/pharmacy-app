# History Feature Testing Checklist

## Prerequisites
- User must be logged in
- Firebase Firestore must be configured
- Calculator must be working

## Test Cases

### 1. Save Calculation
- [ ] Run a calculation on `/calculator`
- [ ] Click "Save to History" button
- [ ] See success alert
- [ ] Verify calculation appears in `/history`

### 2. History List View
- [ ] Navigate to `/history`
- [ ] See saved calculations in grid layout
- [ ] Verify cards show: drug name, instructions, badges, date
- [ ] Verify newest calculations appear first

### 3. Search Functionality
- [ ] Type drug name in search bar → filters correctly
- [ ] Type part of instructions → filters correctly
- [ ] Clear search → shows all calculations
- [ ] Search with no results → shows empty state

### 4. Favorites Filter
- [ ] Click star on a calculation card → toggles favorite
- [ ] Click star button in search bar → shows only favorites
- [ ] Click again → shows all calculations
- [ ] Verify favorite status persists after page reload

### 5. View Detail Page
- [ ] Click "View" button on a calculation card
- [ ] Navigate to `/history/[id]`
- [ ] See full calculation results (same as calculator)
- [ ] Click "Back to History" → returns to list

### 6. Delete Calculation
- [ ] Click trash icon on a calculation
- [ ] Confirm delete dialog
- [ ] Calculation disappears from list
- [ ] Verify it's actually deleted (refresh page)

### 7. Edge Cases
- [ ] Save multiple calculations → all appear
- [ ] Save calculation without being logged in → handled gracefully
- [ ] Try to view calculation with invalid ID → shows error
- [ ] Try to delete calculation that doesn't exist → handled gracefully

### 8. Firestore Verification
- [ ] Check Firestore console → calculations saved in `calculations` collection
- [ ] Verify `userId` field matches current user
- [ ] Verify `createdAt` and `updatedAt` timestamps are set
- [ ] Verify calculation data structure is correct

## Browser Console Checks
- [ ] No errors when saving
- [ ] No errors when loading history
- [ ] No errors when toggling favorite
- [ ] No errors when deleting

## Network Checks (DevTools)
- [ ] Firestore write on save
- [ ] Firestore read on history load
- [ ] Firestore update on favorite toggle
- [ ] Firestore delete on delete action

