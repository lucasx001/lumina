import { fireEvent, render } from '@testing-library/react-native';

import { GoogleSignInButton } from './GoogleSignInButton';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ surface: '#ffffff', text: '#111111' }),
}));

describe('GoogleSignInButton', () => {
  it('starts the supplied Google sign-in flow', () => {
    const onPress = jest.fn();
    const screen = render(<GoogleSignInButton onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disables input while the browser SSO flow is opening', () => {
    const onPress = jest.fn();
    const screen = render(<GoogleSignInButton isLoading onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(screen.getByText('Opening Google…')).toBeTruthy();
    expect(onPress).not.toHaveBeenCalled();
  });
});
