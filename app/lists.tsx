import { useThemeColors } from '@/hooks/useThemeColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from './components/Button';
import { ThemedText } from './components/ThemedText';

type List = {
  _id: string;
  name: string;
  items: {
    _id: string;
    item: string;
    value: string;
    type: 'text' | 'toggle';
  }[];
};

export default function Lists() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colors = useThemeColors();
  const url = 'http://192.168.1.183:3000';
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editedListName, setEditedListName] = useState<string>('');

  const fetchLists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
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
      const sortedLists = data.lists.sort((a: List, b: List) => a.name.localeCompare(b.name));
      setLists(sortedLists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const showAddModal = () => {
    setModalVisible(true);
    setNewListName('');
  };

  const hideAddModal = () => {
    setModalVisible(false);
    setNewListName('');
  };

  const handleAddList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Erreur', 'Le nom de la liste ne peut pas être vide.');
      return;
    }

    if (newListName.trim().length < 2) {
      Alert.alert('Erreur', 'Le nom de la liste doit contenir au moins 2 caractères.');
      return;
    }

    const listExists = lists.some(
      (list) => list.name.toLowerCase() === newListName.trim().toLowerCase()
    );
    if (listExists) {
      Alert.alert('Erreur', 'Une liste avec ce nom existe déjà.');
      return;
    }

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const response = await fetch(`${url}/list/add/${userId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newListName.trim().toLowerCase()
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP! Statut: ${response.status}`);
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('L\'ajout a échoué côté serveur');
      }

      // Mise à jour optimiste
      setLists(prev => {
        const newList = {
          _id: Date.now().toString(), // ID temporaire
          name: newListName.trim(),
          items: []
        };
        return [...prev, newList].sort((a, b) => a.name.localeCompare(b.name));
      });

      hideAddModal();
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout de la liste.');
      console.error(error);
    }
  };

  const handleDeleteList = async (listName: string) => {
    try {
      const listToDelete = lists.find(list => list.name === listName);
      if (!listToDelete) {
        throw new Error('Liste non trouvée');
      }
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const response = await fetch(`${url}/list/${listToDelete.name}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP! Statut: ${response.status}`);
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('La suppression a échoué côté serveur');
      }

      // Mise à jour optimiste
      setLists(prev => prev.filter(list => list.name !== listName));
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression de la liste.');
      console.error(error);
    }
  };

  const handleEditList = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      Alert.alert('Erreur', 'Le nom de la liste ne peut pas être vide.');
      return;
    }

    if (newName.trim().length < 2) {
      Alert.alert('Erreur', 'Le nom de la liste doit contenir au moins 2 caractères.');
      return;
    }

    const listExists = lists.some(
      (list) => list.name.toLowerCase() === newName.trim().toLowerCase() && list.name !== oldName
    );
    if (listExists) {
      Alert.alert('Erreur', 'Une liste avec ce nom existe déjà.');
      return;
    }

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const listToEdit = lists.find(list => list.name === oldName);
      if (!listToEdit) {
        throw new Error('Liste non trouvée');
      }
      const response = await fetch(`${url}/list/name/${oldName}/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newName: newName.trim()
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP! Statut: ${response.status}`);
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('La mise à jour a échoué côté serveur');
      }

      // Mise à jour optimiste
      setLists(prev => prev.map(list => 
        list.name === oldName 
          ? { ...list, name: newName.trim() }
          : list
      ).sort((a, b) => a.name.localeCompare(b.name)));

      setEditingListId(null);
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la modification de la liste.');
      console.error(error);
    }
  };

  const navigateToList = (listId: string, listName: string) => {
    router.push({
      pathname: '/list',
      params: { id: listName, userId },
    });
  };

  const renderItem = ({ item }: { item: List }) => (
    <View key={item.name}>
      <TouchableOpacity
        style={[styles.itemContainer, { borderBottomColor: colors.separator }]}
        onPress={() => navigateToList(item._id, item.name)}
        onLongPress={() => {
          setEditingListId(item._id);
          setEditedListName(item.name);
        }}
      >
        {editingListId === item._id ? (
          <TextInput
            style={[
              styles.editInput,
              { color: colors.police, borderColor: colors.border },
            ]}
            value={editedListName}
            onChangeText={setEditedListName}
            autoFocus
          />
        ) : (
          <>
            <Text style={[styles.itemText, { color: colors.police }]}>
              {item.name}
            </Text>
            <Text style={[styles.itemCount, { color: colors.police }]}>
              {item.items?.length || 0} éléments
            </Text>
          </>
        )}
      </TouchableOpacity>
      {editingListId === item._id && (
        <View style={styles.iconsContainer}>
          <TouchableOpacity
            onPress={() => handleEditList(item.name, editedListName)}
            style={styles.iconLeft}
          >
            <Image
              source={require('@/assets/images/design/ok.png')}
              style={[styles.icon, { tintColor: colors.police }]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteList(item.name)}
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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText variant="body1" color="police">Chargement...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText variant="body1" color="police">{error}</ThemedText>
        <Button onPress={fetchLists} name="Réessayer" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.push('/')}
          style={styles.iconLeft}
        >
          <Image
            source={require('@/assets/images/design/back.png')}
            style={[styles.icon, { tintColor: colors.police, marginBottom: 20 }]}
          />
        </TouchableOpacity>
      </View>

      <ThemedText variant="subtitle1" color="police">
        Mes listes
      </ThemedText>
      <Button onPress={showAddModal} name={'+ Ajouter une liste'} />
      <FlatList
        data={lists}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune liste trouvée.</Text>
        }
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={hideAddModal}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              placeholder="Nom de la liste"
              placeholderTextColor={colors.placeHolder}
              value={newListName}
              onChangeText={setNewListName}
              style={[
                styles.modalInput,
                { color: colors.police, borderColor: colors.police },
              ]}
            />
            <Button onPress={handleAddList} name="Ajouter" />
            <Button onPress={hideAddModal} name="Annuler" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconLeft: {
    alignSelf: 'flex-start',
  },
  icon: {
    width: 24,
    height: 24,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  listContainer: {
    flexGrow: 1,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  editInput: {
    fontSize: 16,
    padding: 5,
    borderWidth: 1,
    borderRadius: 5,
    flex: 1,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconRight: {
    alignSelf: 'flex-end',
  },
});