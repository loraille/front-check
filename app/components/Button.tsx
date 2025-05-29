// Button.tsx
import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps, StyleSheet } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

// Définir les props du bouton
interface ButtonProps extends TouchableOpacityProps {
  name: string; // La prop "name" est obligatoire et de type string
}

// Créer le composant Button
const Button: React.FC<ButtonProps> = ({ name, ...props }) => {
   const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.button,{backgroundColor:colors.bgButton}]}
      {...props} // Propager les autres props (comme onPress)
    >
      <Text style={{ color: colors.policeBut, fontSize: 16 }}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles=StyleSheet.create({
  button: {
  padding: 10,
  borderRadius: 5,
  alignItems: "center",
  justifyContent: "center",
  margin: 5,
  }
})

export default Button;