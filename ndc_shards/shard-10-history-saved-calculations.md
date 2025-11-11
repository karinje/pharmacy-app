# SHARD 10: History & Saved Calculations

## Objective
Implement calculation history storage, retrieval, search, and management with Firestore.

## Dependencies
- Shard 2 (Authentication)
- Shard 8 (Calculation Orchestration)
- Shard 9 (Results Display)

## Files to Create/Modify

```
src/
├── lib/
│   ├── services/
│   │   └── history.service.ts           # NEW: History management service
│   ├── components/
│   │   └── history/
│   │       ├── HistoryList.svelte       # NEW: List of calculations
│   │       ├── HistoryCard.svelte       # NEW: Single history item
│   │       ├── SearchBar.svelte         # NEW: Search interface
│   │       └── FilterPanel.svelte       # NEW: Filter options
│   └── stores/
│       └── history.ts                   # NEW: History state management
└── routes/
    └── (authenticated)/
        └── history/
            ├── +page.svelte             # NEW: History page
            └── [id]/
                └── +page.svelte         # NEW: View saved calculation
```

## Implementation Details

### 1. History Service (`src/lib/services/history.service.ts`)
```typescript
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type QueryConstraint
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { CalculationResult } from '$lib/types/calculation';

export interface SavedCalculation {
  id: string;
  userId: string;
  calculation: CalculationResult;
  notes?: string;
  tags?: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class HistoryService {
  private readonly COLLECTION = 'calculations';
  private readonly MAX_HISTORY = 100; // Per user

  /**
   * Save calculation to history
   */
  async saveCalculation(
    userId: string,
    calculation: CalculationResult,
    notes?: string,
    tags?: string[]
  ): Promise<string> {
    try {
      const saved: Omit<SavedCalculation, 'id'> = {
        userId,
        calculation,
        notes,
        tags: tags || [],
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...saved,
        createdAt: Timestamp.fromDate(saved.createdAt),
        updatedAt: Timestamp.fromDate(saved.updatedAt),
        'calculation.timestamp': Timestamp.fromDate(calculation.timestamp)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error saving calculation:', error);
      throw new Error('Failed to save calculation to history');
    }
  }

  /**
   * Get single calculation by ID
   */
  async getCalculation(id: string, userId: string): Promise<SavedCalculation | null> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to calculation');
      }

      return this.transformFirestoreDoc(id, data);
    } catch (error) {
      console.error('Error fetching calculation:', error);
      throw error;
    }
  }

  /**
   * Get user's calculation history
   */
  async getUserHistory(
    userId: string,
    options: {
      limitCount?: number;
      favoritesOnly?: boolean;
      searchQuery?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<SavedCalculation[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ];

      if (options.favoritesOnly) {
        constraints.push(where('isFavorite', '==', true));
      }

      if (options.startDate) {
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(options.startDate)));
      }

      if (options.endDate) {
        constraints.push(where('createdAt', '<=', Timestamp.fromDate(options.endDate)));
      }

      if (options.limitCount) {
        constraints.push(limit(options.limitCount));
      } else {
        constraints.push(limit(this.MAX_HISTORY));
      }

      const q = query(collection(db, this.COLLECTION), ...constraints);
      const querySnapshot = await getDocs(q);

      let results = querySnapshot.docs.map((doc) =>
        this.transformFirestoreDoc(doc.id, doc.data())
      );

      // Client-side search filter (Firestore doesn't support text search)
      if (options.searchQuery) {
        const searchLower = options.searchQuery.toLowerCase();
        results = results.filter((calc) =>
          calc.calculation.input.drugName.toLowerCase().includes(searchLower) ||
          calc.calculation.input.instructions.toLowerCase().includes(searchLower) ||
          calc.notes?.toLowerCase().includes(searchLower) ||
          calc.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return results;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw new Error('Failed to load calculation history');
    }
  }

  /**
   * Update calculation notes
   */
  async updateNotes(id: string, userId: string, notes: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists() || docSnap.data().userId !== userId) {
        throw new Error('Calculation not found or unauthorized');
      }

      await updateDoc(docRef, {
        notes,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string, userId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists() || docSnap.data().userId !== userId) {
        throw new Error('Calculation not found or unauthorized');
      }

      const currentStatus = docSnap.data().isFavorite || false;
      const newStatus = !currentStatus;

      await updateDoc(docRef, {
        isFavorite: newStatus,
        updatedAt: Timestamp.now()
      });

      return newStatus;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Delete calculation
   */
  async deleteCalculation(id: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists() || docSnap.data().userId !== userId) {
        throw new Error('Calculation not found or unauthorized');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting calculation:', error);
      throw error;
    }
  }

  /**
   * Transform Firestore document to SavedCalculation
   */
  private transformFirestoreDoc(id: string, data: any): SavedCalculation {
    return {
      id,
      userId: data.userId,
      calculation: {
        ...data.calculation,
        timestamp: data.calculation.timestamp?.toDate() || new Date()
      },
      notes: data.notes,
      tags: data.tags || [],
      isFavorite: data.isFavorite || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }
}

export const historyService = new HistoryService();
```

### 2. History Store (`src/lib/stores/history.ts`)
```typescript
import { writable, derived } from 'svelte/store';
import type { SavedCalculation } from '$lib/services/history.service';

interface HistoryState {
  calculations: SavedCalculation[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  favoritesOnly: boolean;
}

function createHistoryStore() {
  const initialState: HistoryState = {
    calculations: [],
    loading: false,
    error: null,
    searchQuery: '',
    favoritesOnly: false
  };

  const { subscribe, set, update } = writable<HistoryState>(initialState);

  return {
    subscribe,

    setCalculations: (calculations: SavedCalculation[]) => {
      update((state) => ({ ...state, calculations, loading: false, error: null }));
    },

    setLoading: (loading: boolean) => {
      update((state) => ({ ...state, loading }));
    },

    setError: (error: string) => {
      update((state) => ({ ...state, error, loading: false }));
    },

    setSearchQuery: (searchQuery: string) => {
      update((state) => ({ ...state, searchQuery }));
    },

    toggleFavoritesFilter: () => {
      update((state) => ({ ...state, favoritesOnly: !state.favoritesOnly }));
    },

    updateCalculation: (id: string, updates: Partial<SavedCalculation>) => {
      update((state) => ({
        ...state,
        calculations: state.calculations.map((calc) =>
          calc.id === id ? { ...calc, ...updates } : calc
        )
      }));
    },

    removeCalculation: (id: string) => {
      update((state) => ({
        ...state,
        calculations: state.calculations.filter((calc) => calc.id !== id)
      }));
    },

    reset: () => {
      set(initialState);
    }
  };
}

export const historyStore = createHistoryStore();

// Derived stores
export const filteredHistory = derived(historyStore, ($store) => {
  let filtered = $store.calculations;

  if ($store.favoritesOnly) {
    filtered = filtered.filter((calc) => calc.isFavorite);
  }

  if ($store.searchQuery) {
    const query = $store.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (calc) =>
        calc.calculation.input.drugName.toLowerCase().includes(query) ||
        calc.calculation.input.instructions.toLowerCase().includes(query) ||
        calc.notes?.toLowerCase().includes(query)
    );
  }

  return filtered;
});

export const isLoading = derived(historyStore, ($store) => $store.loading);
export const historyError = derived(historyStore, ($store) => $store.error);
```

### 3. History Card (`src/lib/components/history/HistoryCard.svelte`)
```svelte
<script lang="ts">
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Star, Trash2, FileText } from 'lucide-svelte';
  import type { SavedCalculation } from '$lib/services/history.service';

  export let calculation: SavedCalculation;
  export let onView: (id: string) => void;
  export let onToggleFavorite: (id: string) => void;
  export let onDelete: (id: string) => void;

  const calc = calculation.calculation;
  const drugName = calc.rxnormData.name;
  const totalQuantity = calc.quantity.totalQuantityNeeded;
  const recommendedNDC = calc.optimization.recommendedPackages[0]?.ndc;
</script>

<Card class="hover:shadow-md transition-shadow">
  <CardHeader>
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="font-semibold text-lg">{drugName}</h3>
        <p class="text-sm text-muted-foreground mt-1">
          {calc.input.instructions}
        </p>
      </div>
      <button
        on:click|stopPropagation={() => onToggleFavorite(calculation.id)}
        class="ml-2"
      >
        <Star
          class={calculation.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
          size={20}
        />
      </button>
    </div>
  </CardHeader>

  <CardContent>
    <div class="space-y-3">
      <div class="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {calc.input.daysSupply} days
        </Badge>
        <Badge variant="secondary">
          {totalQuantity} {calc.parsing.dosageUnit}s
        </Badge>
        {#if recommendedNDC}
          <Badge>NDC: {recommendedNDC}</Badge>
        {/if}
      </div>

      {#if calculation.notes}
        <p class="text-sm text-muted-foreground">{calculation.notes}</p>
      {/if}

      <div class="flex items-center justify-between pt-2">
        <p class="text-xs text-muted-foreground">
          {calculation.createdAt.toLocaleDateString()}
        </p>
        
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            on:click={() => onView(calculation.id)}
          >
            <FileText size={16} class="mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            on:click|stopPropagation={() => onDelete(calculation.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### 4. Search Bar (`src/lib/components/history/SearchBar.svelte`)
```svelte
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Search, X, Star } from 'lucide-svelte';

  export let searchQuery: string = '';
  export let favoritesOnly: boolean = false;
  export let onSearchChange: (query: string) => void;
  export let onToggleFavorites: () => void;

  function clearSearch() {
    searchQuery = '';
    onSearchChange('');
  }
</script>

<div class="flex gap-2">
  <div class="relative flex-1">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
    <Input
      type="text"
      placeholder="Search calculations..."
      bind:value={searchQuery}
      on:input={() => onSearchChange(searchQuery)}
      class="pl-10 pr-10"
    />
    {#if searchQuery}
      <button
        on:click={clearSearch}
        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <X size={20} />
      </button>
    {/if}
  </div>

  <Button
    variant={favoritesOnly ? 'default' : 'outline'}
    on:click={onToggleFavorites}
  >
    <Star size={20} class={favoritesOnly ? 'fill-current' : ''} />
  </Button>
</div>
```

### 5. History List (`src/lib/components/history/HistoryList.svelte`)
```svelte
<script lang="ts">
  import HistoryCard from './HistoryCard.svelte';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import type { SavedCalculation } from '$lib/services/history.service';

  export let calculations: SavedCalculation[];
  export let loading: boolean = false;
  export let onView: (id: string) => void;
  export let onToggleFavorite: (id: string) => void;
  export let onDelete: (id: string) => void;
</script>

{#if loading}
  <div class="space-y-4">
    {#each Array(3) as _}
      <Skeleton class="h-48 w-full" />
    {/each}
  </div>
{:else if calculations.length === 0}
  <Alert>
    <AlertDescription>
      No calculations found. Start by creating a new calculation!
    </AlertDescription>
  </Alert>
{:else}
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each calculations as calculation (calculation.id)}
      <HistoryCard
        {calculation}
        {onView}
        {onToggleFavorite}
        {onDelete}
      />
    {/each}
  </div>
{/if}
```

### 6. History Page (`src/routes/(authenticated)/history/+page.svelte`)
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import SearchBar from '$lib/components/history/SearchBar.svelte';
  import HistoryList from '$lib/components/history/HistoryList.svelte';
  import { Button } from '$lib/components/ui/button';
  import { historyStore, filteredHistory, isLoading } from '$lib/stores/history';
  import { historyService } from '$lib/services/history.service';
  import { user } from '$lib/stores/auth';
  import { Plus } from 'lucide-svelte';

  let searchQuery = '';
  let favoritesOnly = false;

  onMount(async () => {
    if ($user) {
      await loadHistory();
    }
  });

  async function loadHistory() {
    historyStore.setLoading(true);
    try {
      const calculations = await historyService.getUserHistory($user!.uid, {
        favoritesOnly
      });
      historyStore.setCalculations(calculations);
    } catch (error) {
      historyStore.setError(error instanceof Error ? error.message : 'Failed to load history');
    }
  }

  function handleView(id: string) {
    goto(`/history/${id}`);
  }

  async function handleToggleFavorite(id: string) {
    try {
      const newStatus = await historyService.toggleFavorite(id, $user!.uid);
      historyStore.updateCalculation(id, { isFavorite: newStatus });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this calculation?')) {
      return;
    }

    try {
      await historyService.deleteCalculation(id, $user!.uid);
      historyStore.removeCalculation(id);
    } catch (error) {
      console.error('Failed to delete calculation:', error);
    }
  }

  function handleSearchChange(query: string) {
    searchQuery = query;
    historyStore.setSearchQuery(query);
  }

  function handleToggleFavorites() {
    favoritesOnly = !favoritesOnly;
    historyStore.toggleFavoritesFilter();
    loadHistory();
  }
</script>

<svelte:head>
  <title>History - NDC Calculator</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-bold">Calculation History</h1>
      <p class="text-muted-foreground mt-2">
        View and manage your past calculations
      </p>
    </div>
    <Button on:click={() => goto('/calculator')}>
      <Plus size={20} class="mr-2" />
      New Calculation
    </Button>
  </div>

  <div class="mb-6">
    <SearchBar
      {searchQuery}
      {favoritesOnly}
      onSearchChange={handleSearchChange}
      onToggleFavorites={handleToggleFavorites}
    />
  </div>

  <HistoryList
    calculations={$filteredHistory}
    loading={$isLoading}
    onView={handleView}
    onToggleFavorite={handleToggleFavorite}
    onDelete={handleDelete}
  />
</div>
```

### 7. View Saved Calculation (`src/routes/(authenticated)/history/[id]/+page.svelte`)
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import ResultsCard from '$lib/components/results/ResultsCard.svelte';
  import LoadingState from '$lib/components/feedback/LoadingState.svelte';
  import ErrorState from '$lib/components/feedback/ErrorState.svelte';
  import { historyService, type SavedCalculation } from '$lib/services/history.service';
  import { user } from '$lib/stores/auth';
  import { Button } from '$lib/components/ui/button';
  import { ArrowLeft } from 'lucide-svelte';

  let loading = true;
  let error: string | null = null;
  let savedCalculation: SavedCalculation | null = null;

  $: calculationId = $page.params.id;

  onMount(async () => {
    if ($user) {
      await loadCalculation();
    }
  });

  async function loadCalculation() {
    loading = true;
    error = null;

    try {
      const calculation = await historyService.getCalculation(calculationId, $user!.uid);
      
      if (!calculation) {
        error = 'Calculation not found';
        return;
      }

      savedCalculation = calculation;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load calculation';
    } finally {
      loading = false;
    }
  }

  function handleBack() {
    goto('/history');
  }
</script>

<svelte:head>
  <title>View Calculation - NDC Calculator</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
  <Button variant="ghost" on:click={handleBack} class="mb-6">
    <ArrowLeft size={20} class="mr-2" />
    Back to History
  </Button>

  {#if loading}
    <LoadingState message="Loading calculation..." />
  {:else if error}
    <ErrorState message={error} onRetry={loadCalculation} />
  {:else if savedCalculation}
    <ResultsCard
      result={savedCalculation.calculation}
      onNewCalculation={() => goto('/calculator')}
    />
  {/if}
</div>
```

### 8. Update Calculator Page to Save Results (`src/routes/(authenticated)/calculator/+page.svelte`)
```typescript
// Add to existing calculator page

async function handleSave() {
  if (!$calculationResult || !$user) return;

  try {
    const id = await historyService.saveCalculation(
      $user.uid,
      $calculationResult
    );
    
    // Show success message
    alert('Calculation saved to history!');
    
    // Optional: Navigate to saved calculation
    // goto(`/history/${id}`);
  } catch (error) {
    console.error('Failed to save:', error);
    alert('Failed to save calculation');
  }
}
```

## Validation Checklist

- [ ] Calculations saved to Firestore
- [ ] History page displays all calculations
- [ ] Search functionality works
- [ ] Favorites filter works
- [ ] Individual calculation can be viewed
- [ ] Calculations can be deleted
- [ ] Favorite toggle works
- [ ] Pagination handles large histories
- [ ] Security rules prevent unauthorized access

## Success Criteria

✅ Complete history management implemented  
✅ Firestore integration working  
✅ Search and filter functional  
✅ CRUD operations complete  
✅ Security enforced  
✅ UI responsive and intuitive

---
