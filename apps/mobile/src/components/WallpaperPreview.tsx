import { Image, type ImageProps } from 'expo-image';
import { View } from 'react-native';

import { HomeIconsOverlay, LockClockOverlay, StatusBarOverlay } from '@/components/preview';
import { radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type WallpaperPreviewMode = 'home-screen' | 'lock-screen';

export type WallpaperPreviewProps = {
  height: number;
  image: NonNullable<ImageProps['source']>;
  /** Retained for the simple `<WallpaperPreview image lockScreen />` use case. */
  lockScreen?: boolean;
  mode?: WallpaperPreviewMode;
  width: number;
};

export function WallpaperPreview({
  height,
  image,
  lockScreen,
  mode,
  width,
}: WallpaperPreviewProps) {
  const theme = useTheme();
  const previewMode = mode ?? (lockScreen === false ? 'home-screen' : 'lock-screen');
  const previewHeight = Math.max(1, height);
  const previewWidth = Math.max(1, width);
  const cornerRadius = Math.min(32, previewWidth * 0.09);

  return (
    <View
      accessibilityLabel={`${previewMode === 'lock-screen' ? 'Lock screen' : 'Home screen'} wallpaper preview`}
      style={{
        backgroundColor: theme.background,
        borderColor: theme.border,
        borderCurve: 'continuous',
        borderRadius: cornerRadius + radius.sm,
        borderWidth: 1,
        boxShadow: shadows.raised,
        height: previewHeight + 4,
        overflow: 'hidden',
        padding: 2,
        width: previewWidth + 4,
      }}
      testID="wallpaper-preview"
    >
      <View
        style={{
          backgroundColor: theme.surface,
          borderCurve: 'continuous',
          borderRadius: cornerRadius,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <Image
          alt="Wallpaper preview"
          contentFit="cover"
          source={image}
          style={{ height: '100%', width: '100%' }}
          testID="wallpaper-preview-image"
        />
        <View
          pointerEvents="none"
          style={{ bottom: 0, left: 14, position: 'absolute', right: 14, top: 12 }}
        >
          <StatusBarOverlay />
        </View>
        {previewMode === 'lock-screen' ? (
          <View
            pointerEvents="none"
            style={{ left: 12, position: 'absolute', right: 12, top: '24%' }}
          >
            <LockClockOverlay />
          </View>
        ) : (
          <View
            pointerEvents="none"
            style={{ left: 0, position: 'absolute', right: 0, top: '30%' }}
          >
            <HomeIconsOverlay />
          </View>
        )}
      </View>
    </View>
  );
}
