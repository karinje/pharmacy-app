import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { auth } from '$lib/config/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  initialized: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: true,
    initialized: false
  });

  if (browser) {
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, (user) => {
      update((state) => ({
        user,
        loading: false,
        initialized: true
      }));
    });
  }

  return {
    subscribe,
    setUser: (user: FirebaseUser | null) => update((state) => ({ ...state, user })),
    setLoading: (loading: boolean) => update((state) => ({ ...state, loading }))
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, ($auth) => $auth.user);
export const isAuthenticated = derived(authStore, ($auth) => !!$auth.user);
export const isLoading = derived(authStore, ($auth) => $auth.loading);

