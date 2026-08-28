import { useLingui } from '@lingui/react/macro';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type GoogleSignInButtonProps = {
  accessibilityLabel?: string;
  iconOnly?: boolean;
  isLoading?: boolean;
  label?: string;
  loadingLabel?: string;
  onPress: () => void;
};

export function GoogleSignInButton({
  accessibilityLabel,
  iconOnly = false,
  isLoading = false,
  label: labelOverride,
  loadingLabel,
  onPress,
}: GoogleSignInButtonProps) {
  const { t } = useLingui();
  const theme = useTheme();
  const label = isLoading
    ? (loadingLabel ?? t`Opening Google…`)
    : (labelOverride ?? t`Continue with Google`);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: iconOnly ? '#FFFFFF' : theme.card,
        borderColor: theme.border,
        borderCurve: 'continuous',
        borderRadius: radius.full,
        borderWidth: 1,
        height: iconOnly ? 52 : undefined,
        justifyContent: 'center',
        minHeight: 48,
        opacity: pressed || isLoading ? 0.72 : 1,
        paddingHorizontal: iconOnly ? 0 : spacing.lg,
        transform: [{ scale: pressed && !isLoading ? 0.985 : 1 }],
        width: iconOnly ? 52 : undefined,
      })}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
        {isLoading ? (
          <ActivityIndicator color={iconOnly ? theme.primary : theme.text} size="small" />
        ) : (
          <Image
            accessibilityLabel={t`Google`}
            contentFit="contain"
            source={require('../../../assets/images/google-logo.png')}
            style={{ height: 22, width: 22 }}
          />
        )}
        {iconOnly ? null : (
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}
