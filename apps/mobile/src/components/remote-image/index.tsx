import { useLingui } from '@lingui/react/macro';
import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui';

/** Remounts a failed image without caching private account images on disk. */
export function RemoteImage(props: ImageProps & { onRetry?: () => void }) {
  return <RetryableImage key={JSON.stringify(props.source)} {...props} />;
}

function RetryableImage({ style, onRetry, ...props }: ImageProps & { onRetry?: () => void }) {
  const { t } = useLingui();
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <Image
        {...props}
        key={attempt}
        cachePolicy="memory"
        style={StyleSheet.absoluteFill}
        onError={(event) => {
          setFailed(true);
          setLoading(false);
          props.onError?.(event);
        }}
        onLoad={(event) => {
          setFailed(false);
          setLoading(false);
          props.onLoad?.(event);
        }}
      />
      {loading ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
        >
          <ActivityIndicator testID="remote-image-loading" />
        </View>
      ) : null}
      {failed ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            justifyContent: 'center',
            padding: 8,
          }}
        >
          <Button
            label={t`Image failed to load. Retry`}
            variant="secondary"
            onPress={() => {
              setFailed(false);
              setLoading(true);
              setAttempt((value) => value + 1);
              onRetry?.();
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
