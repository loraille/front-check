import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useOfflineSync<T>(
  key: string,
  fetchData: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const freshData = await fetchData();
        if (isMounted) {
          setData(freshData);
          await AsyncStorage.setItem(key, JSON.stringify(freshData));
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [key, fetchData]);

  // Fonction pour forcer une synchronisation
  const sync = async () => {
    try {
      const freshData = await fetchData();
      setData(freshData);
      await AsyncStorage.setItem(key, JSON.stringify(freshData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de synchronisation');
    }
  };

  return { data, isLoading, error, sync };
} 