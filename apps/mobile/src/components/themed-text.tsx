import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type TextVariant = 'body' | 'caption' | 'display' | 'label' | 'subtitle' | 'title';

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
};

const variantStyles: Record<TextVariant, TextStyle> = {
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 18 },
  display: { fontSize: 38, fontWeight: '700', letterSpacing: -1.4, lineHeight: 42 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, lineHeight: 16 },
  subtitle: { fontSize: 19, fontWeight: '600', letterSpacing: -0.3, lineHeight: 24 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -1, lineHeight: 34 },
};

export function ThemedText({ style, variant = 'body', ...props }: ThemedTextProps) {
  const theme = useTheme();
  const fontFamily = ['display', 'subtitle', 'title'].includes(variant)
    ? theme.displayFontFamily
    : theme.fontFamily;

  return (
    <Text
      selectable
      {...props}
      style={[{ color: theme.text, fontFamily }, variantStyles[variant], style]}
    />
  );
}
