import { useThemeColors } from "@/hooks/useThemeColors";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router"; // Pour gérer la navigation
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "./components/Button";
import Input from "./components/Input";
import { ThemedText } from "./components/ThemedText";

export default function Index() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false); // Mode par défaut : Inscription
  const colors = useThemeColors();
  const router = useRouter(); // Utilisé pour naviguer vers d'autres écrans
  const url = 'http://192.168.1.183:3000';

  const handleSignUp = async () => {
    try {
      const response = await fetch(`${url}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        throw new Error("Échec de l'inscription");
      }

      const data = await response.json();
      console.log("Réponse d'inscription :", data);

      if (data.result && data.userInfo) {
        const userId = data.userInfo.id;
        const username = data.userInfo.username; // Supposons que le backend retourne également le nom d'utilisateur
        navigateToLists(userId, username);
      } else {
        alert("Erreur lors de l'inscription.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de l'inscription.");
    }
  };

  const handleSignIn = async () => {
    try {
      const response = await fetch(`${url}/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Réponse de connexion complète :", data);

      if (data.result && data.userInfo) {
        const userId = data.userInfo._id;
        const username = data.userInfo.username;
        const token = data.userInfo.token;
        
        // Stocker les informations de session
        await AsyncStorage.setItem('userSession', JSON.stringify({
          userId,
          username,
          token
        }));

        console.log("Navigation vers lists avec userId:", userId);
        router.replace({
          pathname: '/lists',
          params: { userId, username }
        });
      } else {
        alert("Erreur lors de la connexion : " + (data.message || "Erreur inconnue"));
      }
    } catch (error) {
      console.error("Erreur détaillée:", error);
      alert("Une erreur est survenue lors de la connexion.");
    }
  };

  const toggleMode = () => {
    setIsSignUpMode((prevMode) => !prevMode);
  };

  const navigateToLists = (userId: string, username: string) => {
    // Naviguer vers l'écran Lists en passant l'ID utilisateur et le nom d'utilisateur
    router.replace({
      pathname: '/lists',
      params: { userId, username }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText variant="headline" color="police">
        Toutes mes notes!
      </ThemedText>

      {/* Bouton pour changer de mode */}
      <Button
        onPress={toggleMode}
        name={isSignUpMode ? "Connexion" : "Inscription"}
      ></Button>

      <View style={styles.inputs}>
      {/* Champ pour le nom d'utilisateur */}
      <Input
        label="Nom d'utilisateur"
        placeholder="Entrez votre nom d'utilisateur"
        value={username}
        onChangeText={setUsername}
        keyboardType="default"
      />

      {/* Champ pour l'email (visible uniquement en mode inscription) */}
      {isSignUpMode && (
        <Input
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      )}

      {/* Champ pour le mot de passe */}
      <Input
        label="Mot de passe"
        placeholder="Entrez votre mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      </View>

      {/* Bouton principal (change selon le mode) */}
      <Button
        onPress={isSignUpMode ? handleSignUp : handleSignIn}
        name={"Valider"}
      ></Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 400,
    alignSelf: "center",
    padding: 30,
    margin: 0,
  },
  inputs:{
    marginTop:20
  }
});