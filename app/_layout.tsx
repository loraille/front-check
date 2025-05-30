import { useThemeColors } from "@/hooks/useThemeColors";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from "react";
import { View } from "react-native";

// Garder le splash screen visible pendant que nous initialisons l'app
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colors = useThemeColors();

  const onLayoutRootView = useCallback(async () => {
    // Attendre que l'app soit prête avant de cacher le splash screen
    await SplashScreen.hideAsync();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayoutRootView}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.police,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </View>
  );
}
