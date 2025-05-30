import React, { createContext, ReactNode, useContext } from 'react';
import { useColorScheme } from "react-native";
import { Colors } from "../app/constants/Colors";

type ThemeColors = typeof Colors.light;

const ThemeContext = createContext<ThemeColors>(Colors.light);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useColorScheme() ?? "light";
  return (
    <ThemeContext.Provider value={Colors[theme]}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeColors() {
  return useContext(ThemeContext);
} 