import { Trans, useLingui } from '@lingui/react/macro';
import { Modal, Platform, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useApplyWallpaper } from '@/hooks/use-apply-wallpaper';
import { useSaveAndShare } from '@/hooks/use-save-and-share';
import Toast from 'react-native-toast-message';
import { getAccountSession, isCurrentAccount } from '@/lib/account-session';

export type ApplySheetProps = {
  onRetryImage?: () => void;
  imageUrl: string;
  onDismiss: () => void;
  visible: boolean;
};

export function ApplySheet({ imageUrl, onDismiss, visible, onRetryImage }: ApplySheetProps) {
  const { t } = useLingui();
  const theme = useTheme();
  const { applyingTarget, applyWallpaper, error: applyError } = useApplyWallpaper(imageUrl);
  const {
    activeAction,
    error: saveAndShareError,
    saveWallpaper,
    shareWallpaper,
  } = useSaveAndShare(imageUrl);
  const isAndroid = Platform.OS === 'android';
  const error = applyError ?? saveAndShareError;

  async function runAction(action: () => Promise<void>, message?: string) {
    const account = getAccountSession();
    try {
      await action();
      if (!isCurrentAccount(account)) return;
      if (message) Toast.show({ type: 'success', text1: message });
      onDismiss();
    } catch {
      // Hooks retain the user-facing error for the sheet.
      if (isCurrentAccount(account)) onRetryImage?.();
    }
  }

  const disabled = Boolean(applyingTarget || activeAction);

  return (
    <Modal animationType="slide" onRequestClose={onDismiss} transparent visible={visible}>
      <View style={{ backgroundColor: theme.overlay, flex: 1 }} testID="apply-sheet-backdrop">
        <Pressable
          accessibilityLabel={t`Cancel`}
          accessibilityRole="button"
          onPress={onDismiss}
          style={{ flex: 1 }}
        />
        <ThemedView
          variant="card"
          style={{
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            gap: spacing.md,
            padding: spacing.lg,
            paddingBottom: 36,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              backgroundColor: theme.primary,
              borderRadius: radius.full,
              height: 4,
              width: 40,
            }}
          />
          <ThemedText variant="subtitle">
            <Trans>Apply wallpaper</Trans>
          </ThemedText>
          {isAndroid ? (
            <>
              <ThemedText style={{ color: theme.mutedText }} variant="caption">
                <Trans>Choose where to apply it.</Trans>
              </ThemedText>
              {(
                [
                  ['home', t`Set as home screen`],
                  ['lock', t`Set as lock screen`],
                  ['both', t`Set as both`],
                ] as const
              ).map(([target, label]) => (
                <Button
                  disabled={disabled}
                  fullWidth
                  label={applyingTarget === target ? t`Applying…` : label}
                  loading={applyingTarget === target}
                  key={target}
                  onPress={() =>
                    void runAction(() => applyWallpaper(target), t`Wallpaper applied.`)
                  }
                  testID={`apply-wallpaper-${target}`}
                  variant={target === 'both' ? 'primary' : 'secondary'}
                />
              ))}
            </>
          ) : Platform.OS === 'web' ? (
            <>
              <ThemedText variant="caption">
                <Trans>
                  Web cannot set system wallpaper. Download the image, then apply it in system
                  settings.
                </Trans>
              </ThemedText>
              <Button
                disabled={disabled}
                fullWidth
                icon="download"
                label={activeAction === 'save' ? t`Downloading…` : t`Download image`}
                loading={activeAction === 'save'}
                onPress={() => void runAction(saveWallpaper, t`Wallpaper downloaded.`)}
                testID="download-wallpaper"
                variant="primary"
              />
            </>
          ) : (
            <ThemedText
              style={{ color: theme.mutedText }}
              testID="apply-ios-hint"
              variant="caption"
            >
              <Trans>
                iOS does not allow apps to set system wallpaper directly. Save it, then set it from
                Photos.
              </Trans>
            </ThemedText>
          )}
          {Platform.OS !== 'web' ? (
            <>
              <Button
                disabled={disabled}
                fullWidth
                icon="share"
                label={activeAction === 'share' ? t`Opening share…` : t`Share`}
                loading={activeAction === 'share'}
                onPress={() => void runAction(shareWallpaper)}
                testID="share-wallpaper"
                variant="secondary"
              />
              <Button
                disabled={disabled}
                fullWidth
                icon="download"
                label={activeAction === 'save' ? t`Saving…` : t`Save to Photos`}
                loading={activeAction === 'save'}
                onPress={() => void runAction(saveWallpaper, t`Wallpaper saved to Photos.`)}
                testID="save-wallpaper"
                variant={isAndroid ? 'secondary' : 'primary'}
              />
            </>
          ) : null}
          {error ? (
            <ThemedText style={{ color: theme.error }} testID="apply-sheet-error" variant="caption">
              {error.message}
            </ThemedText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={({ pressed }) => ({
              alignItems: 'center',
              minHeight: 44,
              opacity: pressed ? 0.65 : 1,
              padding: spacing.sm,
            })}
          >
            <ThemedText style={{ color: theme.mutedText }} variant="body">
              <Trans>Cancel</Trans>
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}
