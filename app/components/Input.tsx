// Input.tsx
import { useThemeColors } from "@/hooks/useThemeColors";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";

// Définir les props du composant Input
interface InputProps extends TextInputProps {
  label: string; // Le libellé du champ (ex: "Email", "Password", etc.)
  placeholder: string; // Le texte placeholder
  secureTextEntry?: boolean; // Pour masquer le texte (utile pour les mots de passe)
  value: string; // La valeur actuelle du champ
  onChangeText: (text: string) => void; // Callback pour gérer les changements de texte
}

// Utilisation d'une fonction fléchée pour définir le composant
const Input = ({
  label,
  placeholder,
  secureTextEntry = false,
  value,
  onChangeText,
  ...props
}: InputProps) => {
  const colors = useThemeColors();
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  // Gestion du clic sur l'image "œil"
  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.police }]}>{label}</Text>
      <View style={[styles.inputContainer,{ backgroundColor:colors.bgInput,borderColor:colors.border}]}>
        {/* Champ de saisie */}
        <TextInput
          style={[styles.input, { color: colors.police}]}
          placeholder={placeholder}
          placeholderTextColor={colors.police}
          secureTextEntry={secureTextEntry && !isPasswordVisible} // Masque le texte si nécessaire
          value={value}
          onChangeText={onChangeText}
          {...props} // Propager les autres props de TextInput
        />
        {/* Bouton "œil" avec image PNG */}
        {secureTextEntry && (
          <TouchableOpacity style={styles.eyeButton} onPress={togglePasswordVisibility}>
            <Image
              source={require('@/assets/images/design/eye.png')}
              tintColor={colors.police}
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop:20
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 40,
    
    textAlign: "left" ,
  },
  eyeButton: {
    marginLeft: 8,
  },
  eyeIcon: {
    width: 25,
    height: 25,
    backgroundColor:'transparent'
  },
});

export default Input;