import { create } from 'zustand';
import { User } from '../types/index.js';
import { api } from '../lib/api.js';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('twoshare_token'),
  isLoading: !!localStorage.getItem('twoshare_token'),

  login: (token: string, user: User) => {
    localStorage.setItem('twoshare_token', token);
    set({ token, user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('twoshare_token');
    api.logout().catch(() => {});
    set({ token: null, user: null, isLoading: false });
  },

  updateUser: (updatedFields: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updatedFields } });
    }
  },

  fetchProfile: async () => {
    try {
      const profile = await api.getProfile();
      set({ user: profile, isLoading: false });
    } catch (error) {
      console.warn('Failed to fetch profile:', error);
      get().logout();
    }
  },
}));
