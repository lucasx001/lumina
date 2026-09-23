import { fireEvent, render } from '@testing-library/react-native';
import { RemoteImage } from '@/components/remote-image';
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Image: (props: Record<string, unknown>) => React.createElement(View, props) };
});

it('retries failed images and refreshes an expired access URL', () => {
  const refresh = jest.fn();
  const screen = render(
    <RemoteImage source="https://image.example/expired.png" testID="image" onRetry={refresh} />,
  );
  fireEvent(screen.getByTestId('image'), 'error');
  fireEvent.press(screen.getByText('Image failed to load. Retry'));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Image failed to load. Retry')).toBeNull();
});

it('fills the allocated frame and reports loading, success and failure without losing callbacks', () => {
  const onLoad = jest.fn();
  const onError = jest.fn();
  const screen = render(
    <RemoteImage
      source="https://image.example/a.png"
      testID="image"
      style={{ width: 160, height: 160 }}
      onLoad={onLoad}
      onError={onError}
    />,
  );
  expect(screen.getByTestId('image')).toHaveStyle({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  expect(screen.getByTestId('remote-image-loading')).toBeTruthy();
  fireEvent(screen.getByTestId('image'), 'load', { source: { width: 1024, height: 1024 } });
  expect(onLoad).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('remote-image-loading')).toBeNull();
  screen.rerender(
    <RemoteImage source="https://image.example/b.png" testID="image" onError={onError} />,
  );
  expect(screen.getByTestId('remote-image-loading')).toBeTruthy();
  fireEvent(screen.getByTestId('image'), 'error', { error: 'Forbidden' });
  expect(onError).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('remote-image-loading')).toBeNull();
  fireEvent.press(screen.getByText('Image failed to load. Retry'));
  expect(screen.getByTestId('remote-image-loading')).toBeTruthy();
});
