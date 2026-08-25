import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'destructive' | 'ghost' | 'primary' | 'secondary';

type ButtonProps = {
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: AppIconName;
  label: string;
  loading?: boolean;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: ButtonVariant;
};

export function Button({
  disabled = false,
  fullWidth = false,
  icon,
  label,
  loading = false,
  onPress,
  size = 'md',
  style,
  testID,
  variant = 'primary',
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const palette = {
    destructive: {
      background: theme.error,
      border: theme.error,
      foreground: '#FFFFFF',
    },
    ghost: { background: 'transparent', border: 'transparent', foreground: theme.text },
    primary: {
      background: theme.primary,
      border: theme.primary,
      foreground: theme.primaryForeground,
    },
    secondary: { background: theme.card, border: theme.border, foreground: theme.text },
  }[variant];
  const sizeStyles = {
    sm: { minHeight: 40, paddingHorizontal: spacing.md },
    md: { minHeight: 48, paddingHorizontal: spacing.lg },
    lg: { minHeight: 56, paddingHorizontal: spacing.lg },
  }[size];
  const width: ViewStyle['width'] = fullWidth ? '100%' : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderCurve: 'continuous',
          borderRadius: radius.full,
          borderWidth: 1,
          justifyContent: 'center',
          opacity: isDisabled ? 0.45 : pressed ? 0.84 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
          width,
          ...sizeStyles,
        },
        style,
      ]}
      testID={testID}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        {loading ? (
          <ActivityIndicator color={palette.foreground} size="small" />
        ) : icon ? (
          <AppIcon color={palette.foreground} name={icon} />
        ) : null}
        <ThemedText
          style={{ color: palette.foreground, fontSize: 15, fontWeight: '600' }}
          variant="body"
        >
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}
