import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const url = 'http://192.168.1.183:3000';

interface List {
  _id: string;
  name: string;
  items: {
    _id: string;
    item: string;
    value: string;
    type: 'text' | 'toggle';
  }[];
}

interface ListsState {
  lists: List[];
  isLoading: boolean;
  error: string | null;
  fetchLists: (userId: string) => Promise<void>;
  addList: (list: List) => void;
  updateList: (listId: string, updatedList: List) => void;
  deleteList: (listId: string) => void;
  editList: (listId: string, newName: string) => void;
}

export const useListsStore = create<ListsState>((set) => ({
  lists: [],
  isLoading: false,
  error: null,
  
  fetchLists: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const response = await fetch(`${url}/list/all/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.lists) {
        throw new Error('No lists data received');
      }
      const sortedLists = data.lists.sort((a: List, b: List) => 
        a.name.localeCompare(b.name)
      );
      set({ lists: sortedLists, isLoading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Une erreur est survenue',
        isLoading: false 
      });
    }
  },

  addList: (list: List) => set((state) => ({
    lists: [...state.lists, list].sort((a, b) => a.name.localeCompare(b.name))
  })),

  updateList: (listId: string, updatedList: List) => set((state) => ({
    lists: state.lists.map(list => 
      list._id === listId ? updatedList : list
    ).sort((a, b) => a.name.localeCompare(b.name))
  })),

  deleteList: (listId: string) => set((state) => ({
    lists: state.lists.filter(list => list._id !== listId)
  })),

  editList: (listId: string, newName: string) => set((state) => ({
    lists: state.lists.map(list => 
      list._id === listId ? { ...list, name: newName } : list
    ).sort((a, b) => a.name.localeCompare(b.name))
  }))
})); 