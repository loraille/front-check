import { useThemeColors } from '@/hooks/useThemeColors';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

const styles = StyleSheet.create({
  body: {
    fontSize: 10,
    lineHeight: 16,
  },
  headline: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "bold",
  },
  subtitle1: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "bold",
  },
});

type Props = TextProps & {
  variant?: keyof typeof styles;
  color?: keyof typeof Colors["dark"];
};

export function ThemedText({ variant = "body", color = "grayDark", ...rest }: Props) {
  const colors = useThemeColors();
  const textStyle = styles[variant] ?? styles.body;

  const isValidColor = color in colors;
  const textColor = isValidColor ? colors[color as keyof typeof colors] : colors.police; // Sécurisé

  return <Text style={[textStyle, { color: textColor }]} {...rest} />;
}
