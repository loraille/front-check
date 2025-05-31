import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const url = 'http://192.168.1.183:3000';

interface Item {
  _id: string;
  item: string;
  value: string;
  type: 'text' | 'toggle';
}

interface ListItem {
  _id: string;
  name: string;
  items: Item[];
}

interface ItemsState {
  listDetails: ListItem | null;
  isLoading: boolean;
  error: string | null;
  fetchListDetails: (listId: string, userId: string) => Promise<void>;
  addItem: (item: Item) => void;
  updateItem: (itemName: string, newName: string, newValue: string) => void;
  deleteItem: (itemName: string) => void;
  toggleItem: (itemName: string, newValue: boolean) => void;
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  listDetails: null,
  isLoading: false,
  error: null,

  fetchListDetails: async (listId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const response = await fetch(`${url}/list/${listId}/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.list) {
        throw new Error('No list data received');
      }
      const sortedList = { 
        ...data.list,
        items: data.list.items.sort((a: Item, b: Item) => a.item.localeCompare(b.item))
      };
      set({ listDetails: sortedList, isLoading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Une erreur est survenue',
        isLoading: false 
      });
    }
  },

  addItem: (item: Item) => set((state) => {
    if (!state.listDetails) return state;
    return {
      listDetails: {
        ...state.listDetails,
        items: [...state.listDetails.items, item].sort((a, b) => a.item.localeCompare(b.item))
      }
    };
  }),

  updateItem: (itemName: string, newName: string, newValue: string) => set((state) => {
    if (!state.listDetails) return state;
    return {
      listDetails: {
        ...state.listDetails,
        items: state.listDetails.items.map(item => 
          item.item === itemName 
            ? { ...item, item: newName, value: newValue, type: item.type }
            : item
        ).sort((a, b) => a.item.localeCompare(b.item))
      }
    };
  }),

  deleteItem: (itemName: string) => set((state) => {
    if (!state.listDetails) return state;
    return {
      listDetails: {
        ...state.listDetails,
        items: state.listDetails.items.filter(item => item.item !== itemName)
      }
    };
  }),

  toggleItem: (itemName: string, newValue: boolean) => set((state) => {
    if (!state.listDetails) return state;
    const updatedValue = newValue ? 'true' : 'false';
    return {
      listDetails: {
        ...state.listDetails,
        items: state.listDetails.items.map(item => 
          item.item === itemName 
            ? { ...item, value: updatedValue }
            : item
        )
      }
    };
  })
})); 