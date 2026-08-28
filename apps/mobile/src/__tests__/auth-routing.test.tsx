import { render } from '@testing-library/react-native';

import { RootNavigator } from '@/app/_layout';

const mockAuthState: { isLoaded: boolean; isSignedIn: boolean } = {
  isLoaded: false,
  isSignedIn: false,
};

jest.mock('@clerk/expo', () => ({
  ClerkProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => mockAuthState,
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');

  return { Image: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock('expo-router/stack', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stack = ({ children }: { children: unknown }) =>
    React.createElement(React.Fragment, null, children);
  Stack.Protected = ({ children, guard }: { children: unknown; guard: boolean }) =>
    guard ? React.createElement(React.Fragment, null, children) : null;
  Stack.Screen = ({ name }: { name: string }) =>
    React.createElement(View, { testID: `route-${name}` });

  return { Stack };
});

describe('authenticated routing', () => {
  it('waits for Clerk before exposing any app route', () => {
    mockAuthState.isLoaded = false;
    mockAuthState.isSignedIn = false;
    const screen = render(<RootNavigator />);

    expect(screen.getByTestId('auth-loading-screen')).toBeTruthy();
    expect(screen.queryByTestId('route-(tabs)')).toBeNull();
    expect(screen.queryByTestId('route-(auth)')).toBeNull();
  });

  it('exposes only authentication routes while signed out', () => {
    mockAuthState.isLoaded = true;
    mockAuthState.isSignedIn = false;
    const screen = render(<RootNavigator />);

    expect(screen.getByTestId('route-(auth)')).toBeTruthy();
    expect(screen.queryByTestId('route-(tabs)')).toBeNull();
  });

  it('exposes wallpaper tabs only after sign-in', () => {
    mockAuthState.isLoaded = true;
    mockAuthState.isSignedIn = true;
    const screen = render(<RootNavigator />);

    expect(screen.getByTestId('route-(tabs)')).toBeTruthy();
    expect(screen.queryByTestId('route-(auth)')).toBeNull();
  });
});
