// Toggle.tsx
import { useThemeColors } from "@/hooks/useThemeColors";
import React, { useState } from "react";
import { Switch, StyleSheet, View } from "react-native";

interface ToggleProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ value, onValueChange }) => {
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      <Switch
        trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
        thumbColor={value ? colors.switchOn: colors.switchOff}
        ios_backgroundColor="#3e3e3e"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Toggle;