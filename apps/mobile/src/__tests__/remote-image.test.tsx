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
