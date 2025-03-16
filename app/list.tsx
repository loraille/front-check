import React, { useState, useEffect, useRef } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColors";
import { capitalizeFirstLetter } from "./module/utils";
import Toggle from "./components/Toggle";
import Button from "./components/Button";
import { ThemedText } from "./components/ThemedText";


// Définir le type d'une liste et d'un item
type ListItem = {
  _id: string;
  name: string;
  items: Array<{ _id: string; item: string; value: string; type: 'text' | 'toggle' }>;
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
  const url ="http://back-checklist.vercel.app";
  const [listDetails, setListDetails] = useState<ListItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemName, setEditedItemName] = useState<string>("");
  const [editedItemValue, setEditedItemValue] = useState<string>("");
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'text' | 'toggle'>('text');

  const showAddModal = () => {
    setModalVisible(true);
    setNewItemName('');
  };
  
  const hideAddModal = () => {
    setModalVisible(false);
    setNewItemName('');
  };
  
  const handleAddItem = () => {
    if (!newItemName.trim()) return;
  
    // Vérifie si l'élément existe déjà dans la liste
    const itemExists = listDetails?.items.some(item => item.item.toLowerCase() === newItemName.trim().toLowerCase());
    if (itemExists) {
      alert("Un élément avec ce nom existe déjà.");
      return;
    }
  
    const itemValue = newItemType === 'toggle' ? 'false' : ' ';
  
    fetch(`${url}/list/add/item/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item: newItemName.trim(),
        value: itemValue,
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.result) {
        fetchListDetails();
        hideAddModal();
      }
    });
  };
  
  
  const fetchListDetails = () => {
    fetch(`${url}/list/${id}`)
      .then((response) => response.json())
      .then((data: { list: ListItem }) => {
        if (data.list) {
          // Trier les éléments par ordre alphabétique
          const sortedList = { ...data.list };
          sortedList.items.sort((a, b) => a.item.localeCompare(b.item));
          setListDetails(sortedList);
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des détails de la liste :", error);
      });
  };

  const navigateToLists = (userId: string) => {
    router.push({
      pathname: '/lists',
      params: { userId }
    });
  };

  const handleReturn = () => {
    navigateToLists(userId);
  };

  useEffect(() => {
    fetchListDetails();
  }, [id]);



  const handleEditItem = (itemId: string, newName: string, newValue: string) => {
    fetch(`${url}/list/item/update/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item: newName.trim() || undefined,
        value: newValue.trim() || undefined,
      }),
    })
      .then((response) => response.json())
      .then((data: { result: boolean }) => {
        if (data.result) {
          setEditingItemId(null);
          fetchListDetails();
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la modification de l'item :", error);
      });
  };

  const handleDeleteItem = (itemId: string) => {
    fetch(`${url}/list/item/delete/${itemId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data: { result: boolean }) => {
        if (data.result) {
          fetchListDetails();
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la suppression de l'item :", error);
      });
  };

  const handleToggleChange = (itemId: string, newValue: boolean) => {
    setEditedItemValue(newValue ? "true" : "false");
    handleEditItem(itemId, "", newValue ? "true" : "false");
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View>
      <TouchableOpacity
        style={[styles.itemContainer,{borderBottomColor:colors.separator}]}
        onLongPress={() => {
          setEditingItemId(item._id);
          setEditedItemName(item.item);
          setEditedItemValue(item.value);
        }}
      >
        {editingItemId === item._id ? (
        
          <TextInput
            style={[styles.editInput,{color:colors.police,borderColor:colors.border}]}
            value={editedItemName}
            onChangeText={setEditedItemName}
            autoFocus
          />
        ) : (
          <Text style={[styles.itemText,{color:colors.police}]}>{capitalizeFirstLetter(item.item)}</Text>
        )}
        {editingItemId === item._id ? (
        
          <TextInput
          style={[styles.editInput,{color:colors.police,borderColor:colors.border,marginLeft:10}]}
            value={editedItemValue}
            onChangeText={setEditedItemValue}
            keyboardType={"default"}
          />
        ) : (
          item.value.toLowerCase() === "true" || item.value.toLowerCase() === "false" ? (
            <Toggle
              value={item.value.toLowerCase() === "true"}
              onValueChange={(newValue) => handleToggleChange(item._id, newValue)}
            />
          ) : (
            <Text style={[styles.valueText,{color:colors.police}]}>{item.value}</Text>
          )
        )}
      </TouchableOpacity>
      {editingItemId === item._id && (
        <View style={styles.iconsContainer}>
          <TouchableOpacity
            onPress={() => handleEditItem(item._id, editedItemName.trim() || item.item, editedItemValue)}
            style={styles.iconLeft}
          >
            <Image
              source={require("@/assets/images/design/ok.png")}
              style={[styles.icon,{tintColor:colors.police}]}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteItem(item._id)} style={styles.iconRight}>
            <Image
              source={require("@/assets/images/design/suppress.png")}
              style={[styles.icon,{tintColor:colors.police}]}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (!listDetails) {
    return <Text>Chargement...</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={handleReturn} style={styles.iconLeft}>
        <Image
          source={require("@/assets/images/design/back.png")}
          style={[styles.icon,{tintColor:colors.police,marginBottom:20}]}
        />
      </TouchableOpacity>
      <ThemedText variant="subtitle1" color="police">
              Détail de la liste
      </ThemedText>
      <View style={styles.listName}>
      <ThemedText  variant="headline" color="police">
      "{capitalizeFirstLetter(listDetails.name)}"
      </ThemedText>
      </View>
     
      <Button onPress={showAddModal} name={"+ Ajouter un élément"} />
      <FlatList
        data={listDetails.items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun élément trouvé.</Text>}
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={hideAddModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent,{backgroundColor:colors.background,borderColor:colors.border}]}>
            <TextInput
              placeholder="Nom de l'item"
              placeholderTextColor={colors.placeHolder} 
              value={newItemName}
              onChangeText={setNewItemName}
              style={[styles.modalInput,{color:colors.police,borderColor:colors.police}]}
            />
           <View style={styles.imageContainer}>
        <TouchableOpacity onPress={() => setNewItemType('text')} style={styles.imageButton}>
          <Image
            source={require("@/assets/images/design/text.png")}
            style={[styles.image,{tintColor:colors.police}, newItemType === 'text' && styles.selectedImage]}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setNewItemType('toggle')} style={styles.imageButton}>
          <Image
            source={require("@/assets/images/design/switch.png")}
            style={[styles.image,{tintColor:colors.police},  newItemType === 'toggle' && styles.selectedImage]}
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
  },
  listName: {
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
      borderWidth:1,
      borderRadius:5,
    flex: 1,
  },
  valueInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 5,
    textAlign: "right",
    width: "40%",
  },
  valueText: {
    fontSize: 16,
    textAlign: "right",
  },
  iconsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconLeft: {
    alignSelf: "flex-start",
  },
  iconRight: {
    alignSelf: "flex-end",
  },
  icon: {
    width: 24,
    height: 24,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
  listContainer: {
    flexGrow: 1,
    marginTop:20
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    borderWidth:1
  },
  modalInput: {
    borderWidth: 1,
    borderRadius:5,
    padding: 10,
    marginBottom: 15,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  radioButton: {
    padding: 10,
  },
  imageContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
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
  halfWidthInput: {
    width: "50%",
    paddingHorizontal: 5,
  },
  
});
