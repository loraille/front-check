import React, { useState, useEffect, useCallback } from "react";
import { FlatList, StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Image } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"; // Utilisez useRouter pour la navigation
import { useThemeColors } from "@/hooks/useThemeColors";
import { capitalizeFirstLetter } from "./module/utils";
import Input from "./components/Input";
import Button from "./components/Button";
import { ThemedText } from "./components/ThemedText";

// Définir le type d'une liste
type ListItem = {
  _id: string;
  name: string;
};

export default function Lists() {
  const { userId, username } = useLocalSearchParams<{ userId: string; username: string }>();
  const colors = useThemeColors();
  const url ='http://back-checklist.vercel.app';
  const [lists, setLists] = useState<ListItem[]>([]); // Liste des listes
  const [newListName, setNewListName] = useState<string>(""); // Nom de la nouvelle liste
  const [editingListId, setEditingListId] = useState<string | null>(null); // ID de la liste en cours d'édition
  const [editedListName, setEditedListName] = useState<string>(""); // Nom modifié de la liste
  const router = useRouter(); // Utilisez useRouter pour la navigation

  // Récupérer les listes depuis l'API
  useFocusEffect(
    useCallback(() => {
      fetchLists();
    }, [userId])
  );

  const fetchLists = () => {
    fetch(`${url}/list/all/${userId}`)
      .then((response) => response.json())
      .then((data: { list: ListItem[] }) => {
        if (data.list) {
          setLists(data.list);
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération des listes :', error);
      });
  };

  // Ajouter une nouvelle liste
  const handleAddList = () => {
    if (!newListName.trim()) {
      Alert.alert("Erreur", "Le nom de la liste ne peut pas être vide.");
      return;
    }
    fetch(`${url}/list/add/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, name: newListName.toLocaleLowerCase() }),
    })
      .then((response) => response.json())
      .then((data: { result: boolean }) => {
        if (data.result) {
          setNewListName(""); // Réinitialiser le champ
          fetchLists(); // Rafraîchir la liste
        }
      })
      .catch((error) => {
        console.error('Erreur lors de l\'ajout de la liste :', error);
      });
  };

  // Supprimer une liste
  const handleDeleteList = (listId: string) => {
    fetch(`${url}/list/${listId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data: { result: boolean }) => {
        if (data.result) {
          fetchLists(); // Rafraîchir la liste
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la suppression de la liste :', error);
      });
  };

  // Modifier une liste
  const handleEditList = (listId: string, newName: string) => {
    fetch(`${url}/list/name/${listId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    })
      .then((response) => response.json())
      .then((data: { result: boolean }) => {
        if (data.result) {
          setEditingListId(null); // Quitter le mode édition
          fetchLists(); // Rafraîchir la liste
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la modification de la liste :', error);
      });
  };

  // Navigation vers le screen List.tsx avec l'ID de la liste
  const handleNavigateToList = (listId: string) => {
    router.push({
      pathname: '/list',
      params: { id: listId, userId: userId } // Ajout du userId
    });
  };

  // Rendu d'un élément de la liste
  const renderItem = ({ item }: { item: ListItem }) => (
    <View>
      {/* Affichage du nom de la liste ou du champ de texte en mode édition */}
      <TouchableOpacity
        style={[styles.listItem,{borderBottomColor:colors.separator}]}
        onLongPress={() => {
          setEditingListId(item._id); // Activer le mode édition
          setEditedListName(item.name); // Initialiser le champ d'édition avec le nom actuel
        }}
        onPress={() => handleNavigateToList(item._id)} // Navigation au clic
      >
        {editingListId === item._id ? (
           <Input
            value={editedListName}
            onChangeText={setEditedListName}
             label={"Editer ou supprimer"} placeholder={""}         />
        ) : (
          <Text style={[styles.listItemText,{color:colors.police}]}>{capitalizeFirstLetter(item.name)}</Text>
        )}
      </TouchableOpacity>

      {/* Icônes ok et suppress en mode édition */}
      {editingListId === item._id && (
        <View style={styles.iconsContainer}>
          <TouchableOpacity onPress={() => handleEditList(item._id, editedListName)} style={styles.iconLeft}>
            <Image
              source={require("@/assets/images/design/ok.png")} // Chemin de l'image "ok"
              style={[styles.icon,{tintColor:colors.police}]}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteList(item._id)} style={styles.iconRight}>
            <Image
              source={require("@/assets/images/design/suppress.png")} // Chemin de l'image "suppress"
              style={[styles.icon,{tintColor:colors.police}]}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <ThemedText variant="headline" color="police">"Mes listes"</ThemedText>
      {/* Champ pour ajouter une nouvelle liste */}
      {/* <View > */}
      
        <Input

          placeholder="Nom de la nouvelle liste"
          value={newListName}
          onChangeText={setNewListName}
          label={"Nouvelle liste"}       
        />
          <Button  
          onPress={handleAddList}
          name={"+ Ajouter une liste"}
          />
     
     
      {/* Liste des listes */}
      <FlatList
        data={lists}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune liste trouvée.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  addInput: {
    width:250,
  },
  listContainer: {
    flexGrow: 1,
    marginTop:20
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  listItemText: {
    fontSize: 16,
  },
  editInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 5,
    flex: 1,
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
});