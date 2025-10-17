// Zustand store for form state management
import { create } from 'zustand';
import { FormData } from './types';

interface FormState {
  currentStep: number;
  formData: Partial<FormData>;
  isSaving: boolean;
  lastSavedAt: string | null;
  
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<FormData>) => void;
  setFormData: (data: Partial<FormData>) => void;
  setIsSaving: (saving: boolean) => void;
  setLastSavedAt: (timestamp: string) => void;
  resetForm: () => void;
}

export const useFormStore = create<FormState>((set) => ({
  currentStep: 1,
  formData: {},
  isSaving: false,
  lastSavedAt: null,

  setCurrentStep: (step) => set({ currentStep: step }),
  
  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),
  
  setFormData: (data) => set({ formData: data }),
  
  setIsSaving: (saving) => set({ isSaving: saving }),
  
  setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),
  
  resetForm: () =>
    set({
      currentStep: 1,
      formData: {},
      isSaving: false,
      lastSavedAt: null,
    }),
}));

interface AuthState {
  user: { id: string; email: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  setUser: (user: { id: string; email: string } | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  checkSession: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setIsAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  
  checkSession: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated && data.user) {
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));

