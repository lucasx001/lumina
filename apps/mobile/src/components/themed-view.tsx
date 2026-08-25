import { View, type ViewProps } from 'react-native';

import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  variant?: 'card' | 'surface';
};

export function ThemedView({ style, variant = 'surface', ...props }: ThemedViewProps) {
  const theme = useTheme();

  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: variant === 'card' ? theme.card : theme.surface,
          borderCurve: 'continuous',
          ...(variant === 'card'
            ? {
                borderColor: theme.border,
                borderRadius: radius.md,
                borderWidth: 1,
                boxShadow: shadows.card,
                padding: spacing.lg,
              }
            : {}),
        },
        style,
      ]}
    />
  );
}
