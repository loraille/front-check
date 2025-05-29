import { Text, TextProps } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

type ThemedTextProps = TextProps & {
  variant?: 'headline' | 'subtitle1' | 'body1';
  color?: keyof ReturnType<typeof useThemeColors>;
};

export const ThemedText = ({ variant, color = 'police', style, ...props }: ThemedTextProps) => {
  const colors = useThemeColors();
  const textColor = colors[color];

  const getFontSize = () => {
    switch (variant) {
      case 'headline':
        return 24;
      case 'subtitle1':
        return 18;
      case 'body1':
      default:
        return 16;
    }
  };

  return (
    <Text
      style={[
        {
          color: textColor,
          fontSize: getFontSize(),
          fontWeight: variant === 'headline' ? 'bold' : 'normal',
        },
        style,
      ]}
      {...props}
    />
  );
};

export default ThemedText;
