import { useThemeColors } from '@/hooks/useThemeColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
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

// Définir le type d'une liste et d'un item
type ListItem = {
  _id: string;
  name: string;
  items: {
    _id: string;
    item: string;
    value: string;
    type: 'text' | 'toggle';
  }[];
};

type Item = {
  _id: string;
  item: string;
  value: string;
  type: 'text' | 'toggle';
};

export default function List() {
  const { id, userId } = useLocalSearchParams<{ id: string; userId: string }>();
  const colors = useThemeColors();
  const url = 'http://192.168.1.183:3000';
  const [listDetails, setListDetails] = useState<ListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemName, setEditedItemName] = useState<string>('');
  const [editedItemValue, setEditedItemValue] = useState<string>('');
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'text' | 'toggle'>('toggle');
  const [isSoundOn, setIsSoundOn] = useState(true);

  const fetchListDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const response = await fetch(`${url}/list/${id}/${userId}`, {
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
      const sortedList = { ...data.list };
      sortedList.items.sort((a: Item, b: Item) => a.item.localeCompare(b.item));
      setListDetails(sortedList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    fetchListDetails();
  }, [fetchListDetails]);

  const showAddModal = () => {
    setModalVisible(true);
    setNewItemName('');
    setNewItemType('toggle');
  };

  const hideAddModal = () => {
    setModalVisible(false);
    setNewItemName('');
    setNewItemType('toggle');
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'élément ne peut pas être vide.');
      return;
    }

    if (newItemName.trim().length < 2) {
      Alert.alert('Erreur', 'Le nom de l\'élément doit contenir au moins 2 caractères.');
      return;
    }

    if (!listDetails) return;

    const itemExists = listDetails.items.some(
      (item) => item.item.toLowerCase() === newItemName.trim().toLowerCase()
    );
    if (itemExists) {
      Alert.alert('Erreur', 'Un élément avec ce nom existe déjà.');
      return;
    }

    const itemValue = newItemType === 'toggle' ? 'false' : 'à définir';
    const newItem = {
      _id: Date.now().toString(), // ID temporaire
      item: newItemName.trim(),
      value: itemValue,
      type: newItemType
    };

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const response = await fetch(`${url}/list/add/item/${listDetails.name}/${userId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item: newItem.item.toLowerCase(),
          value: newItem.value,
          type: newItem.type
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
      setListDetails(prev => {
        if (!prev) return null;
        const updatedItems = [...prev.items, newItem].sort((a, b) => a.item.localeCompare(b.item));
        return { ...prev, items: updatedItems };
      });

      hideAddModal();
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout de l\'élément.');
      console.error(error);
    }
  };

  const navigateToLists = (userId: string) => {
    router.push({
      pathname: '/lists',
      params: { userId },
    });
  };

  const handleReturn = () => {
    navigateToLists(userId);
  };

  const handleEditItem = async (
    itemName: string,
    newName: string,
    newValue: string
  ) => {
    if (!listDetails) return;

    const updatedName = newName.trim();
    const updatedValue = newValue.trim();

    // Trouver l'item actuel par son nom
    const currentItem = listDetails.items.find(item => item.item === itemName);
    if (!currentItem) {
      console.error('Item not found:', itemName);
      return;
    }

    // Vérifier si le nouveau nom existe déjà (sauf si c'est le même item)
    if (updatedName !== currentItem.item) {
      const nameExists = listDetails.items.some(
        item => item.item.toLowerCase() === updatedName.toLowerCase()
      );
      if (nameExists) {
        alert('Un élément avec ce nom existe déjà.');
        return;
      }
    }

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const response = await fetch(`${url}/list/item/update/${listDetails.name}/${userId}/${currentItem.item}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item: updatedName,
          value: updatedValue || currentItem.value,
          type: currentItem.type
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
      setListDetails(prev => {
        if (!prev) return null;
        const updatedItems = prev.items.map(item => 
          item.item === itemName 
            ? { ...item, item: updatedName, value: updatedValue || item.value }
            : item
        ).sort((a, b) => a.item.localeCompare(b.item));
        return { ...prev, items: updatedItems };
      });

      setEditingItemId(null);
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la modification de l\'élément.');
      console.error(error);
    }
  };

  const handleDeleteItem = async (itemName: string) => {
    if (!listDetails) return;

    const currentItem = listDetails.items.find(item => item.item === itemName);
    if (!currentItem) {
      console.error('Item not found:', itemName);
      return;
    }

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const response = await fetch(`${url}/list/item/delete/${listDetails.name}/${userId}/${currentItem.item}`, {
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
      setListDetails(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter(item => item.item !== itemName)
        };
      });
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression de l\'élément.');
      console.error(error);
    }
  };

  const handleToggleChange = async (itemName: string, newValue: boolean) => {
    if (!listDetails) return;

    const currentItem = listDetails.items.find(item => item.item === itemName);
    if (!currentItem) {
      console.error('Item not found:', itemName);
      return;
    }

    const updatedValue = newValue ? 'true' : 'false';

    // Lecture du son en fonction de la valeur
    if (newValue) {
      playSound('piece');
    } else {
      playSound('tuyau');
    }

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const response = await fetch(`${url}/list/item/update/${listDetails.name}/${userId}/${currentItem.item}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item: currentItem.item,
          value: updatedValue
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
      setListDetails(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item => 
            item.item === itemName 
              ? { ...item, value: updatedValue }
              : item
          )
        };
      });
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la modification de l\'élément.');
      console.error(error);
    }
  };

  const toggleSound = () => {
    setIsSoundOn((prev) => !prev); // Inverse l'état actuel
  };

  const playSound = async (soundFile: string) => {
    if (!isSoundOn) return; // Ne joue aucun son si le son est désactivé

    const soundPath =
      soundFile === 'piece'
        ? require('@/assets/sounds/piece.wav')
        : require('@/assets/sounds/tuyau.wav');

    const { sound } = await Audio.Sound.createAsync(soundPath);
    await sound.playAsync();
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View key={item.item}>
      <TouchableOpacity
        style={[styles.itemContainer, { borderBottomColor: colors.separator }]}
        onLongPress={() => {
          setEditingItemId(item.item);
          setEditedItemName(item.item);
          setEditedItemValue(item.value);
        }}
      >
        {editingItemId === item.item ? (
          <TextInput
            style={[
              styles.editInput,
              { color: colors.police, borderColor: colors.border },
            ]}
            value={editedItemName}
            onChangeText={setEditedItemName}
            autoFocus
          />
        ) : (
          <Text style={[styles.itemText, { color: colors.police }]}>
            {item.item}
          </Text>
        )}

        {editingItemId === item.item ? (
          <TextInput
            style={[
              styles.editInput,
              {
                color: colors.police,
                borderColor: colors.border,
                marginLeft: 10,
              },
            ]}
            value={editedItemValue}
            onChangeText={setEditedItemValue}
            keyboardType={'default'}
          />
        ) : item.value.toLowerCase() === 'true' ||
          item.value.toLowerCase() === 'false' ? (
          <TouchableOpacity
            onPress={() =>
              handleToggleChange(item.item, item.value.toLowerCase() !== 'true')
            }
          >
            <Image
              source={
                item.value.toLowerCase() === 'true'
                  ? require('@/assets/images/design/check.png')
                  : require('@/assets/images/design/nocheck.png')
              }
              style={[styles.icon, { tintColor: colors.police }]}
            />
          </TouchableOpacity>
        ) : (
          <Text style={[styles.valueText, { color: colors.police }]}>
            {item.value}
          </Text>
        )}
      </TouchableOpacity>

      {editingItemId === item.item && (
        <View style={styles.iconsContainer}>
          <TouchableOpacity
            onPress={() =>
              handleEditItem(
                item.item,
                editedItemName,
                editedItemValue
              )
            }
            style={styles.iconLeft}
          >
            <Image
              source={require('@/assets/images/design/ok.png')}
              style={[styles.icon, { tintColor: colors.police }]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteItem(item.item)}
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
        <Button onPress={fetchListDetails} name="Réessayer" />
      </View>
    );
  }

  if (!listDetails) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText variant="body1" color="police">Liste non trouvée</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleReturn} style={styles.iconLeft}>
          <Image
            source={require('@/assets/images/design/back.png')}
            style={[styles.icon, { tintColor: colors.police, marginBottom: 20 }]}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleSound} style={styles.iconRight}>
          <Image
            source={
              isSoundOn
                ? require('@/assets/images/design/soundon.png')
                : require('@/assets/images/design/soundoff.png')
            }
            style={[styles.icon, { tintColor: colors.police, marginBottom: 20 }]}
          />
        </TouchableOpacity>
      </View>

      <ThemedText variant="subtitle1" color="police">
        Détail de la liste
      </ThemedText>
      <View style={styles.listName}>
        <ThemedText variant="headline" color="police">
          {listDetails.name}
        </ThemedText>
      </View>
      <Button onPress={showAddModal} name={'+ Ajouter un élément'} />
      <FlatList
        data={listDetails.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.item}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun élément trouvé.</Text>
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
              placeholder="Nom de l'item"
              placeholderTextColor={colors.placeHolder}
              value={newItemName}
              onChangeText={setNewItemName}
              style={[
                styles.modalInput,
                { color: colors.police, borderColor: colors.police },
              ]}
            />
            <View style={styles.imageContainer}>
              <TouchableOpacity
                onPress={() => setNewItemType('toggle')}
                style={styles.imageButton}
              >
                <Image
                  source={require('@/assets/images/design/check.png')}
                  style={[
                    styles.image,
                    { tintColor: colors.police },
                    newItemType === 'toggle' && styles.selectedImage,
                  ]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewItemType('text')}
                style={styles.imageButton}
              >
                <Image
                  source={require('@/assets/images/design/text.png')}
                  style={[
                    styles.image,
                    { tintColor: colors.police },
                    newItemType === 'text' && styles.selectedImage,
                  ]}
                />
              </TouchableOpacity>
            </View>
            <Button onPress={handleAddItem} name="Ajouter" />
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
  iconRight: {
    alignSelf: 'flex-end',
  },
  listName: {
    margin: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  editInput: {
    fontSize: 16,
    padding: 5,
    borderWidth: 1,
    borderRadius: 5,
    flex: 1,
  },
  valueInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
    textAlign: 'right',
    width: '40%',
  },
  valueText: {
    fontSize: 16,
    textAlign: 'right',
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  icon: {
    width: 24,
    height: 24,
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
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  imageButton: {
    padding: 10,
  },
  image: {
    width: 50,
    height: 50,
    opacity: 0.5,
  },
  selectedImage: {
    opacity: 1,
  },
});