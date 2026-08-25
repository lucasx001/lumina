import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator, type DimensionValue, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function LoadingState({ label }: { label?: string }) {
  const theme = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.muted,
        borderCurve: 'continuous',
        borderRadius: radius.md,
        flexDirection: 'row',
        gap: spacing.sm,
        padding: spacing.md,
      }}
    >
      <ActivityIndicator color={theme.primary} />
      <ThemedText selectable variant="body">
        {label ?? <Trans>Loading…</Trans>}
      </ThemedText>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLingui();
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.muted,
        borderColor: theme.border,
        borderCurve: 'continuous',
        borderRadius: radius.md,
        borderWidth: 1,
        gap: spacing.sm,
        padding: spacing.md,
      }}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        <AppIcon color={theme.error} name="close" size={16} />
        <ThemedText selectable style={{ color: theme.error, flex: 1 }} variant="caption">
          {message}
        </ThemedText>
      </View>
      {onRetry ? (
        <Button icon="refresh" label={t`Retry`} onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}

export function EmptyState({
  actionLabel,
  actionTestId,
  description,
  onAction,
  title,
}: {
  actionLabel?: string;
  actionTestId?: string;
  description: string;
  onAction?: () => void;
  title: string;
}) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 48 }}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.muted,
          borderRadius: radius.full,
          height: 56,
          justifyContent: 'center',
          width: 56,
        }}
      >
        <AppIcon color={theme.mutedText} name="image" size={24} />
      </View>
      <ThemedText selectable variant="subtitle">
        {title}
      </ThemedText>
      <ThemedText selectable style={{ color: theme.mutedText, textAlign: 'center' }} variant="body">
        {description}
      </ThemedText>
      {onAction && actionLabel ? (
        <Button
          icon="sparkles"
          label={actionLabel}
          onPress={onAction}
          style={{ alignSelf: 'center' }}
          testID={actionTestId ?? 'empty-state-action'}
        />
      ) : null}
    </View>
  );
}

export function Skeleton({
  height = 16,
  width = '100%',
}: {
  height?: number;
  width?: DimensionValue;
}) {
  const { t } = useLingui();
  const theme = useTheme();

  return (
    <View
      accessibilityLabel={t`Loading placeholder`}
      style={{
        backgroundColor: theme.muted,
        borderCurve: 'continuous',
        borderRadius: 8,
        height,
        opacity: 0.65,
        width,
      }}
    />
  );
}
