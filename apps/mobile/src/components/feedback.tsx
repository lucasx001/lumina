import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator, type DimensionValue, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppIcon, Button } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';

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

export function ErrorState({
  message,
  onRetry,
}: {
  message: string | Error;
  onRetry?: () => void;
}) {
  const { t } = useLingui();
  const theme = useTheme();
  const displayMessage = localizeError(message, t);

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
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
          {displayMessage}
        </ThemedText>
      </View>
      {onRetry ? (
        <Button icon="refresh" label={t`Retry`} onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}

type Translator = ReturnType<typeof useLingui>['t'];

function localizeError(message: string | Error, t: Translator) {
  if (!(message instanceof ApiError))
    return typeof message === 'string' ? message : message.message;

  switch (message.code) {
    case 'API_URL_NOT_CONFIGURED':
      return t`The app server is not configured.`;
    case 'REQUEST_ABORTED':
      return t`Request cancelled.`;
    case 'REQUEST_TIMEOUT':
      return t`The request timed out. Check your connection and try again.`;
    case 'NETWORK_ERROR':
      return t`Could not connect to the server. Check your connection and try again.`;
    case 'UNAUTHORIZED':
      return t`Please sign in to continue.`;
    case 'CATEGORY_NOT_FOUND':
      return t`This category is no longer available.`;
    case 'SOURCE_IMAGE_NOT_FOUND':
      return t`The source image is no longer available.`;
    case 'JOB_NOT_FOUND':
      return t`This generation task is no longer available.`;
    case 'VALIDATION_ERROR':
      return t`Check the highlighted fields and try again.`;
    case 'RATE_LIMITED':
      return t`Too many requests. Please wait and try again.`;
    case 'UPLOAD_FAILED':
    case 'LOCAL_FILE_ERROR':
      return t`The selected image could not be uploaded. Try again.`;
    case 'WALLPAPER_NOT_FOUND':
    case 'IMAGE_NOT_FOUND':
    case 'WALLPAPER_IMAGE_NOT_FOUND':
      return t`This wallpaper is no longer available.`;
    default:
      return message.message;
  }
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
