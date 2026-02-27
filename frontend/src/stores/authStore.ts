import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { accessToken, user } = response.data;
        
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        set({ 
          user, 
          token: accessToken, 
          isAuthenticated: true 
        });
      },

      register: async (email: string, password: string, name: string) => {
        const response = await api.post('/auth/register', { email, password, name });
        const { accessToken, user } = response.data;
        
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        set({ 
          user, 
          token: accessToken, 
          isAuthenticated: true 
        });
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        const token = get().token;
        if (!token) return;
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/me');
          set({ user: response.data, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'vortex44-auth',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
