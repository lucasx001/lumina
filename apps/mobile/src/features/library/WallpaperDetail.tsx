import { Trans, useLingui } from '@lingui/react/macro';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeIconsOverlay } from '@/components/preview/home-icons-overlay';
import { LockClockOverlay } from '@/components/preview/lock-clock-overlay';
import { StatusBarOverlay } from '@/components/preview/status-bar-overlay';
import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import type { WallpaperPreviewMode } from '@/components/WallpaperPreview';
import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WallpaperListItem } from '@/lib/api';

type WallpaperDetailProps = {
  actionSlot?: ReactNode;
  onClose: () => void;
  onModeChange: (mode: WallpaperPreviewMode) => void;
  onToggleFavorite?: () => void;
  previewMode: WallpaperPreviewMode;
  wallpaper: WallpaperListItem;
};

export function WallpaperDetail({
  actionSlot,
  onClose,
  onModeChange,
  onToggleFavorite,
  previewMode,
  wallpaper,
}: WallpaperDetailProps) {
  const { i18n, t } = useLingui();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [infoVisible, setInfoVisible] = useState(false);
  const modeLabels: Record<string, string> = {
    edit: t`Edit`,
    outpaint: t`Extend`,
    style: t`Style transfer`,
    text2img: t`Text creation`,
    upscale: t`Upscale`,
  };
  const generatedLabel = modeLabels[wallpaper.mode] ?? t`Generated`;
  const resolution =
    wallpaper.width && wallpaper.height
      ? `${wallpaper.width} × ${wallpaper.height}`
      : t`Resolution unavailable`;

  return (
    <View style={{ backgroundColor: theme.background, flex: 1 }} testID="wallpaper-detail">
      {wallpaper.resultImageUrl ? (
        <Image
          accessibilityLabel={t`Full-screen wallpaper preview`}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: wallpaper.resultImageUrl }}
          style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
          testID="wallpaper-detail-image"
          transition={180}
        />
      ) : (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.card,
            bottom: 0,
            justifyContent: 'center',
            left: 0,
            padding: spacing.xl,
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        >
          <AppIcon color={theme.mutedText} name="image" size={32} />
          <ThemedText style={{ marginTop: spacing.sm, textAlign: 'center' }} variant="body">
            <Trans>This wallpaper has no preview image.</Trans>
          </ThemedText>
        </View>
      )}

      {wallpaper.resultImageUrl ? (
        <View
          pointerEvents="none"
          style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
        >
          <View
            style={{ left: spacing.md, position: 'absolute', right: spacing.md, top: spacing.md }}
          >
            <StatusBarOverlay />
          </View>
          {previewMode === 'lock-screen' ? (
            <View style={{ left: spacing.md, position: 'absolute', right: spacing.md, top: '20%' }}>
              <LockClockOverlay />
            </View>
          ) : (
            <View style={{ left: 0, position: 'absolute', right: 0, top: '28%' }}>
              <HomeIconsOverlay />
            </View>
          )}
        </View>
      ) : null}

      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          left: spacing.md,
          position: 'absolute',
          right: spacing.md,
          top: insets.top + spacing.sm,
        }}
      >
        <RoundAction
          accessibilityLabel={t`Back to library`}
          icon="arrow-left"
          onPress={onClose}
          testID="close-wallpaper-detail"
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {onToggleFavorite ? (
            <RoundAction
              accessibilityLabel={
                wallpaper.favorite
                  ? t`Remove wallpaper from favorites`
                  : t`Add wallpaper to favorites`
              }
              active={wallpaper.favorite}
              icon={wallpaper.favorite ? 'favorite-filled' : 'favorite'}
              onPress={onToggleFavorite}
              testID="detail-toggle-favorite"
            />
          ) : null}
          <RoundAction
            accessibilityLabel={t`Wallpaper information`}
            active={infoVisible}
            icon="info"
            onPress={() => setInfoVisible((visible) => !visible)}
            testID="detail-toggle-info"
          />
        </View>
      </View>

      {infoVisible ? (
        <View
          style={{
            backgroundColor: 'rgba(19, 21, 33, 0.92)',
            borderColor: 'rgba(255, 255, 255, 0.18)',
            borderCurve: 'continuous',
            borderRadius: radius.lg,
            borderWidth: 1,
            boxShadow: shadows.raised,
            gap: spacing.sm,
            padding: spacing.md,
            position: 'absolute',
            right: spacing.md,
            top: insets.top + 68,
            width: 236,
          }}
          testID="wallpaper-information"
        >
          <ThemedText style={{ color: '#FFFFFF' }} variant="subtitle">
            {wallpaper.category ?? t`Uncategorized`}
          </ThemedText>
          <InformationRow label={t`Mode`} value={generatedLabel} />
          <InformationRow label={t`Size`} value={resolution} />
          <InformationRow
            label={t`Created`}
            value={formatDate(wallpaper.createdAt, i18n.locale, generatedLabel)}
          />
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: 'rgba(19, 21, 33, 0.92)',
          borderColor: 'rgba(255, 255, 255, 0.16)',
          borderCurve: 'continuous',
          borderRadius: radius.xl,
          borderWidth: 1,
          bottom: insets.bottom + spacing.md,
          boxShadow: shadows.raised,
          gap: spacing.md,
          left: spacing.md,
          padding: spacing.md,
          position: 'absolute',
          right: spacing.md,
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.10)',
            borderRadius: radius.full,
            flexDirection: 'row',
            padding: spacing.xs,
          }}
        >
          <PreviewModeButton
            icon="lock"
            label={t`Lock screen`}
            onPress={() => onModeChange('lock-screen')}
            selected={previewMode === 'lock-screen'}
            testID="detail-preview-mode-lock-screen"
          />
          <PreviewModeButton
            icon="home"
            label={t`Home screen`}
            onPress={() => onModeChange('home-screen')}
            selected={previewMode === 'home-screen'}
            testID="detail-preview-mode-home-screen"
          />
        </View>

        {actionSlot ?? (
          <View style={{ alignItems: 'center', gap: spacing.xs }} testID="apply-sheet-placeholder">
            <ThemedText style={{ color: '#FFFFFF' }} variant="body">
              <Trans>Apply and share coming soon</Trans>
            </ThemedText>
            <ThemedText style={{ color: '#C5C5CE', textAlign: 'center' }} variant="caption">
              <Trans>Choose lock screen, home screen, and sharing actions when available.</Trans>
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

function RoundAction({
  accessibilityLabel,
  active = false,
  icon,
  onPress,
  testID,
}: {
  accessibilityLabel: string;
  active?: boolean;
  icon: 'arrow-left' | 'favorite' | 'favorite-filled' | 'info';
  onPress: () => void;
  testID: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: active ? theme.primary : 'rgba(19, 21, 33, 0.78)',
        borderColor: 'rgba(255, 255, 255, 0.18)',
        borderRadius: radius.full,
        borderWidth: 1,
        height: 48,
        justifyContent: 'center',
        opacity: pressed ? 0.76 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
        width: 48,
      })}
      testID={testID}
    >
      <AppIcon color="#FFFFFF" name={icon} size={20} />
    </Pressable>
  );
}

function PreviewModeButton({
  icon,
  label,
  onPress,
  selected,
  testID,
}: {
  icon: 'home' | 'lock';
  label: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: selected ? theme.primary : 'transparent',
        borderRadius: radius.full,
        flex: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        minHeight: 44,
        opacity: pressed ? 0.8 : 1,
      })}
      testID={testID}
    >
      <AppIcon color="#FFFFFF" name={icon} size={17} />
      <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }} variant="caption">
        {label}
      </ThemedText>
    </Pressable>
  );
}

function InformationRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
      <ThemedText style={{ color: '#B7B7C2' }} variant="caption">
        {label}
      </ThemedText>
      <ThemedText numberOfLines={1} style={{ color: '#FFFFFF', flexShrink: 1 }} variant="caption">
        {value}
      </ThemedText>
    </View>
  );
}

function formatDate(createdAt: string, locale: string, fallback: string): string {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString(locale);
}
