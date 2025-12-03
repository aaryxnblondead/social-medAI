import { create } from 'zustand';
import { auth } from '../api/client';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await auth.register(email, password);
      localStorage.setItem('token', response.token);
      set({ token: response.token, user: response.user, loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await auth.login(email, password);
      localStorage.setItem('token', response.token);
      set({ token: response.token, user: response.user, loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchUser: async () => {
    set({ loading: true });
    try {
      const response = await auth.me();
      set({ user: response.user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
