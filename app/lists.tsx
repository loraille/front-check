import React, { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { capitalizeFirstLetter } from './module/utils';
import Input from './components/Input';
import Button from './components/Button';
import { ThemedText } from './components/ThemedText';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
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
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

type ListItem = { _id: string; name: string };

export default function Lists() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colors = useThemeColors();
  const url = 'http://back-checklist.vercel.app';
  const [lists, setLists] = useState<ListItem[]>([]);
  const [newListName, setNewListName] = useState<string>('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editedListName, setEditedListName] = useState<string>('');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchLists();
    }, [userId])
  );

  const fetchLists = async () => {
    try {
      const response = await fetch(`${url}/list/all/${userId}`);
      const data = await response.json();
      if (data.list) setLists(data.list);
    } catch (error) {
      console.error('Erreur lors de la récupération des listes :', error);
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Erreur', 'Le nom de la liste ne peut pas être vide.');
      return;
    }
    try {
      setLists((prevLists) => [
        ...prevLists,
        { _id: 'temp-id', name: newListName },
      ]);
      setNewListName('');
      await fetch(`${url}/list/add/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: newListName.toLowerCase() }),
      });
      fetchLists();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la liste :", error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      setLists((prevLists) => prevLists.filter((list) => list._id !== listId));
      await fetch(`${url}/list/${listId}`, { method: 'DELETE' });
      fetchLists();
    } catch (error) {
      console.error('Erreur lors de la suppression de la liste :', error);
    }
  };

  const handleEditList = async (listId: string, newName: string) => {
    try {
      setLists((prevLists) =>
        prevLists.map((list) =>
          list._id === listId ? { ...list, name: newName } : list
        )
      );
      setEditingListId(null);
      await fetch(`${url}/list/name/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      fetchLists();
    } catch (error) {
      console.error('Erreur lors de la modification de la liste :', error);
    }
  };

  const handleNavigateToList = (listId: string) => {
    router.push({ pathname: '/list', params: { id: listId, userId } });
  };

  const renderItem = ({ item }: { item: ListItem }) => (
    <View>
      <TouchableOpacity
        style={[styles.listItem, { borderBottomColor: colors.separator }]}
        onPress={() => handleNavigateToList(item._id)}
      >
        {editingListId === item._id ? (
          <Input
            value={editedListName}
            onChangeText={setEditedListName}
            label="Editer ou supprimer"
            placeholder=""
          />
        ) : (
          <TouchableOpacity
            onLongPress={() => {
              setEditingListId(item._id);
              setEditedListName(item.name);
            }}
            onPress={() => handleNavigateToList(item._id)}
          >
            <Text style={[styles.listItemText, { color: colors.police }]}>
              {capitalizeFirstLetter(item.name)}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {editingListId === item._id && (
        <View style={styles.iconsContainer}>
          <TouchableOpacity
            onPress={() => handleEditList(item._id, editedListName)}
          >
            <Image
              source={require('@/assets/images/design/ok.png')}
              style={[styles.icon, { tintColor: colors.police }]}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteList(item._id)}>
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
          <Text style={styles.emptyText}>Aucune liste trouvée.</Text>
        }
      />
    </View>
  );
}