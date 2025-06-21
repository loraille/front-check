import { useThemeColors } from '@/hooks/useThemeColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from './components/Button';
import { ThemedText } from './components/ThemedText';

type Item = {
  _id: string;
  item: string;
  value: string;
  type: 'text' | 'toggle';
};

type ListDetails = {
  _id: string;
  name: string;
  items: Item[];
};

export default function List() {
  const { id, userId } = useLocalSearchParams<{ id: string; userId: string }>();
  const colors = useThemeColors();
  const url = 'https://bckcklist.vercel.app';
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'text' | 'toggle'>('toggle');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemName, setEditedItemName] = useState<string>('');
  const [editedItemValue, setEditedItemValue] = useState<string>('');
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [listDetails, setListDetails] = useState<ListDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const encodedListName = encodeURIComponent(id);
      const response = await fetch(`${url}/list/${encodedListName}/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP! Statut: ${response.status}`);
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('Erreur lors de la récupération des données');
      }

      // Trier les items par ordre alphabétique
      const sortedList = {
        ...data.list,
        items: data.list.items.sort((a: Item, b: Item) => 
          a.item.localeCompare(b.item, 'fr', { sensitivity: 'base' })
        )
      };

      setListDetails(sortedList);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    fetchListDetails();
  }, [id, userId, fetchListDetails]);

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

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const encodedListName = encodeURIComponent(listDetails.name);
      const response = await fetch(`${url}/list/add/item/${encodedListName}/${userId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item: newItemName.trim().toLowerCase(),
          value: newItemType === 'toggle' ? 'false' : 'à définir',
          type: newItemType
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP! Statut: ${response.status}`);
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('L\'ajout a échoué côté serveur');
      }

      hideAddModal();
      await fetchListDetails();
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
      const encodedListName = encodeURIComponent(listDetails.name);
      const encodedItemName = encodeURIComponent(currentItem.item);
      const response = await fetch(`${url}/list/item/update/${encodedListName}/${userId}/${encodedItemName}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item: updatedName,
          value: currentItem.type === 'toggle' ? currentItem.value : updatedValue,
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

      // Fermer l'édition avant le rechargement
      setEditingItemId(null);
      
      // Recharger les données depuis le serveur
      await fetchListDetails();
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
      const encodedListName = encodeURIComponent(listDetails.name);
      const encodedItemName = encodeURIComponent(currentItem.item);
      const response = await fetch(`${url}/list/item/delete/${encodedListName}/${userId}/${encodedItemName}`, {
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

      // Recharger les données depuis le serveur
      await fetchListDetails();
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

    // Lecture du son en fonction de la valeur
    if (newValue) {
      playSound('piece');
    } else {
      playSound('tuyau');
    }

    // Mise à jour optimiste de l'état local
    setListDetails(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.item === itemName
            ? { ...item, value: newValue ? 'true' : 'false' }
            : item
        )
      };
    });

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const { token } = JSON.parse(userSession || '{}');
      const encodedListName = encodeURIComponent(listDetails.name);
      const encodedItemName = encodeURIComponent(currentItem.item);
      const response = await fetch(`${url}/list/item/update/${encodedListName}/${userId}/${encodedItemName}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item: currentItem.item,
          value: newValue ? 'true' : 'false'
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP! Statut: ${response.status}`);
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('La mise à jour a échoué côté serveur');
      }
    } catch (error) {
      // En cas d'erreur, on recharge la liste pour revenir à l'état correct
      await fetchListDetails();
      Alert.alert('Erreur', 'Une erreur est survenue lors de la modification de l\'élément.');
      console.error(error);
    }
  };

  const toggleSound = () => {
    setIsSoundOn((prev) => !prev);
  };

  const playSound = async (soundFile: string) => {
    if (!isSoundOn) return;

    const soundPath =
      soundFile === 'piece'
        ? require('@/assets/sounds/piece.wav')
        : require('@/assets/sounds/tuyau.wav');

    const { sound } = await Audio.Sound.createAsync(soundPath);
    await sound.playAsync();
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View>
      <TouchableOpacity
        style={[styles.itemContainer, { borderBottomColor: colors.separator }]}
        onPress={() => {
          if (item.type === 'toggle') {
            handleToggleChange(item.item, item.value.toLowerCase() !== 'true');
          }
        }}
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
        <Button onPress={() => fetchListDetails()} name="Réessayer" />
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
          contentContainerStyle={[styles.listContainer, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 30,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconLeft: {
    alignSelf: 'flex-start',
    padding: 10,
  },
  iconRight: {
    alignSelf: 'flex-end',
    padding: 10,
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
    paddingVertical: 15,
    marginBottom: 20,
    backgroundColor: 'transparent',
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
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  swipeActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});