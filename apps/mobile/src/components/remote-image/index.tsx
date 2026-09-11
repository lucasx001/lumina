import { useLingui } from '@lingui/react/macro';
import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui';

/** Remounts a failed image without caching private account images on disk. */
export function RemoteImage(props: ImageProps & { onRetry?: () => void }) {
  return <RetryableImage key={JSON.stringify(props.source)} {...props} />;
}

function RetryableImage({ style, onRetry, ...props }: ImageProps & { onRetry?: () => void }) {
  const { t } = useLingui();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <Image
        {...props}
        key={attempt}
        cachePolicy="memory"
        style={{ width: '100%', height: '100%' }}
        onError={() => setFailed(true)}
        onLoad={() => setFailed(false)}
      />
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
              setAttempt((value) => value + 1);
              onRetry?.();
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
