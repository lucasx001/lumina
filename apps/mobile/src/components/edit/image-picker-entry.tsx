import { Trans, useLingui } from '@lingui/react/macro';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { uploadSourceImage } from '@/lib/api';

type ImagePickerEntryProps = {
  onUploaded: (sourceImageUrl: string) => void;
  sourceImageUrl?: string;
};

const supportedContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function ImagePickerEntry({ onUploaded, sourceImageUrl }: ImagePickerEntryProps) {
  const { t } = useLingui();
  const [error, setError] = useState<Error>();
  const [isUploading, setIsUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string>();
  const theme = useTheme();

  async function chooseImage() {
    setError(undefined);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ['images'],
        quality: 1,
      });
      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const contentType = asset.mimeType ?? 'image/jpeg';
      if (!supportedContentTypes.has(contentType)) {
        throw new Error(t`Choose a JPEG, PNG, or WebP image.`);
      }

      setLocalUri(asset.uri);
      setIsUploading(true);
      onUploaded(
        await uploadSourceImage(
          asset.uri,
          contentType as 'image/jpeg' | 'image/png' | 'image/webp',
        ),
      );
    } catch (reason) {
      const nextError =
        reason instanceof Error ? reason : new Error(t`Image upload failed. Try again.`);
      setError(
        nextError.message.includes('native module')
          ? new Error(t`The image module is incomplete. Install the latest development build.`)
          : nextError,
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <ThemedText variant="subtitle">
        <Trans>Start with an image</Trans>
      </ThemedText>
      <ThemedText style={{ color: theme.mutedText }} variant="caption">
        <Trans>Choose an image to extend, enhance, edit, or turn into a reusable style.</Trans>
      </ThemedText>
      {localUri || sourceImageUrl ? (
        <Image
          accessibilityLabel={t`Selected source image`}
          contentFit="cover"
          source={localUri ?? sourceImageUrl}
          style={{ borderRadius: radius.md, height: 180, width: '100%' }}
        />
      ) : null}
      {isUploading ? <LoadingState label={t`Uploading image securely…`} /> : null}
      {error ? <ErrorState message={error.message} onRetry={() => void chooseImage()} /> : null}
      <Button
        disabled={isUploading}
        icon="upload"
        label={sourceImageUrl ? t`Change image` : t`Choose image`}
        loading={isUploading}
        onPress={() => void chooseImage()}
        testID="pick-source-image"
        variant="secondary"
      />
    </View>
  );
}
