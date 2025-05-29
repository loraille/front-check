import { useThemeColors } from '@/hooks/useThemeColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from './components/Button';
import Input from './components/Input';
import { ThemedText } from './components/ThemedText';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  listContainer: { flexGrow: 1, marginTop: 20 },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  listItemText: { fontSize: 16 },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  icon: { width: 24, height: 24 },
  iconLeft: { alignSelf: 'flex-start' },
  iconRight: { alignSelf: 'flex-end' },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

type ListItem = { _id: string; name: string };

export default function Lists() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colors = useThemeColors();
  const url = 'http://192.168.1.183:3000';
  const [lists, setLists] = useState<ListItem[]>([]);
  const [newListName, setNewListName] = useState<string>('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editedListName, setEditedListName] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (!userId) {
      router.replace('/');
      return;
    }
  }, [userId, router]);

  const fetchLists = useCallback(async () => {
    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      console.log('Token récupéré:', token);
      console.log('userId utilisé:', userId);
      
      const response = await fetch(`${url}/list/all/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Réponse complète du serveur:', data);
      
      if (data.lists && Array.isArray(data.lists)) {
        console.log('Listes reçues:', data.lists);
        setLists(data.lists);
      } else {
        console.log('Format de données invalide:', data);
        setLists([]);
      }
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des listes :', error);
      setLists([]);
    }
  }, [userId, url]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchLists();
      }
    }, [userId, fetchLists])
  );

  const handleAddList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Erreur', 'Le nom de la liste ne peut pas être vide.');
      return;
    }
    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');

      setLists((prevLists) => [
        ...prevLists,
        { _id: 'temp-id', name: newListName },
      ]);
      setNewListName('');
      await fetch(`${url}/list/add/${userId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newListName.toLowerCase() }),
      });
      fetchLists();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la liste :", error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');

      // Trouver le nom de la liste
      const listToDelete = lists.find(list => list._id === listId);
      if (!listToDelete) {
        throw new Error('Liste non trouvée');
      }

      Alert.alert(
        'Supprimer la liste',
        'Êtes-vous sûr de vouloir supprimer cette liste ? Cette action est irréversible.',
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              setLists((prevLists) => prevLists.filter((list) => list._id !== listId));
              await fetch(`${url}/list/${listToDelete.name}/${userId}`, { 
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              fetchLists();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la suppression de la liste :', error);
    }
  };

  const handleEditList = async (listId: string, newName: string) => {
    console.log('Début handleEditList avec:', { listId, newName });
    
    if (!newName.trim()) {
      Alert.alert('Erreur', 'Le nom de la liste ne peut pas être vide.');
      return;
    }

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      console.log('Token récupéré:', token);

      // Trouver l'ancien nom de la liste
      const oldList = lists.find(list => list._id === listId);
      if (!oldList) {
        throw new Error('Liste non trouvée');
      }

      // Mise à jour optimiste de l'interface
      setLists((prevLists) =>
        prevLists.map((list) =>
          list._id === listId ? { ...list, name: newName } : list
        )
      );
      setEditingListId(null);

      const requestBody = { newName: newName.toLowerCase() };
      console.log('Envoi de la requête avec:', {
        url: `${url}/list/name/${oldList.name}/${userId}`,
        method: 'PUT',
        body: requestBody
      });

      const response = await fetch(`${url}/list/name/${oldList.name}/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Réponse reçue:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse d\'erreur:', errorText);
        throw new Error(`Erreur HTTP! Statut: ${response.status}, Message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Données reçues:', data);

      if (!data.result) {
        throw new Error('La mise à jour a échoué côté serveur');
      }

      // Rafraîchir la liste pour s'assurer que les données sont synchronisées
      await fetchLists();
    } catch (error) {
      console.error('Erreur détaillée lors de la modification de la liste :', error);
      Alert.alert('Erreur', 'Impossible de modifier la liste. Veuillez réessayer.');
      // Restaurer l'état précédent en cas d'erreur
      await fetchLists();
    }
  };

  const handleNavigateToList = (listId: string) => {
    console.log('Navigating to list:', { listId, userId });
    const list = lists.find(l => l._id === listId);
    if (!list) {
      console.error('List not found:', listId);
      return;
    }
    router.push({
      pathname: '/list',
      params: { 
        id: list.name,
        userId: userId 
      }
    });
  };

  const renderItem = ({ item }: { item: ListItem }) => (
    <View key={item._id}>
      <TouchableOpacity
        style={[styles.listItem, { borderBottomColor: colors.separator }]}
        onPress={() => handleNavigateToList(item._id)}
        onLongPress={() => {
          setEditingListId(item._id);
          setEditedListName(item.name);
        }}
      >
        {editingListId === item._id ? (
          <TextInput
            style={[styles.listItemText, { color: colors.police }]}
            value={editedListName}
            onChangeText={setEditedListName}
            autoFocus
          />
        ) : (
          <Text style={[styles.listItemText, { color: colors.police }]}>
            {item.name}
          </Text>
        )}
      </TouchableOpacity>
  
      {editingListId === item._id && (
        <View style={styles.iconsContainer}>
          <TouchableOpacity
            onPress={() => handleEditList(item._id, editedListName)}
            style={styles.iconLeft}
          >
            <Image
              source={require('@/assets/images/design/ok.png')}
              style={[styles.icon, { tintColor: colors.police }]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteList(item._id)}
            style={styles.iconRight}
          >
            <Image
              source={require('@/assets/images/design/suppress.png')}
              style={[styles.icon, { tintColor: colors.police }]}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedText variant="headline" color="police">
        Mes listes
      </ThemedText>
      <Input
        placeholder="Nom de la nouvelle liste"
        value={newListName}
        onChangeText={setNewListName}
        label="Nouvelle liste"
      />
      <Button onPress={handleAddList} name="+ Ajouter une liste" />
      <FlatList
        data={lists}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.police }]}>
              {lists.length === 0 ? "Aucune liste trouvée." : "Chargement..."}
            </Text>
          </View>
        }
      />
    </View>
  );
}