import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';

import PasswordResetScreen from '@/app/(auth)/password-reset';
import SignInScreen from '@/app/(auth)/sign-in';
import SignUpScreen from '@/app/(auth)/sign-up';

const mockPush = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignIn = {
  create: jest.fn(),
  finalize: jest.fn(),
  reset: jest.fn(),
  password: jest.fn(),
  resetPasswordEmailCode: {
    sendCode: jest.fn(),
    submitPassword: jest.fn(),
    verifyCode: jest.fn(),
  },
  status: 'needs_identifier',
  supportedSecondFactors: [],
};
const mockSignUp = {
  finalize: jest.fn(),
  password: jest.fn(),
  reset: jest.fn(),
  status: 'missing_requirements',
  verifications: { sendEmailCode: jest.fn(), verifyEmailCode: jest.fn() },
};
const emptySignInErrors = {
  code: null,
  identifier: null,
  password: null,
};
const emptySignUpErrors = {
  captcha: null,
  code: null,
  emailAddress: null,
  firstName: null,
  lastName: null,
  legalAccepted: null,
  password: null,
  phoneNumber: null,
  username: null,
};

jest.mock('@clerk/expo', () => ({
  useSignIn: () => ({
    errors: { fields: emptySignInErrors, global: null, raw: null },
    fetchStatus: 'idle',
    signIn: mockSignIn,
  }),
  useSignUp: () => ({
    errors: { fields: emptySignUpErrors, global: null, raw: null },
    fetchStatus: 'idle',
    signUp: mockSignUp,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');

  return { Image: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    authError: undefined,
    isSigningIn: false,
    signInWithGoogle: mockSignInWithGoogle,
  }),
}));

describe('authentication screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.status = 'needs_identifier';
    mockSignIn.password.mockResolvedValue({ error: null });
    mockSignIn.finalize.mockResolvedValue({ error: null });
    mockSignIn.reset.mockResolvedValue({ error: null });
    mockSignIn.resetPasswordEmailCode.sendCode.mockResolvedValue({ error: null });
    mockSignIn.resetPasswordEmailCode.verifyCode.mockResolvedValue({ error: null });
    mockSignIn.resetPasswordEmailCode.submitPassword.mockResolvedValue({ error: null });
    mockSignUp.status = 'missing_requirements';
    mockSignUp.password.mockResolvedValue({ error: null });
    mockSignUp.verifications.sendEmailCode.mockResolvedValue({ error: null });
    mockSignUp.verifications.verifyEmailCode.mockResolvedValue({ error: null });
    mockSignUp.finalize.mockResolvedValue({ error: null });
  });

  it('signs in with email and password then finalizes the Clerk session', async () => {
    mockSignIn.password.mockImplementation(async () => {
      mockSignIn.status = 'complete';
      return { error: null };
    });
    const screen = render(<SignInScreen />);

    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'person@example.com');
    fireEvent.changeText(screen.getByTestId('sign-in-password'), 'correct-horse-battery');
    fireEvent.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() =>
      expect(mockSignIn.password).toHaveBeenCalledWith({
        emailAddress: 'person@example.com',
        password: 'correct-horse-battery',
      }),
    );
    expect(mockSignIn.finalize).toHaveBeenCalledTimes(1);
  });

  it('shows validation errors immediately through a toast', () => {
    const screen = render(<SignInScreen />);

    fireEvent.press(screen.getByTestId('sign-in-submit'));

    expect(Toast.show).toHaveBeenCalledWith({
      text1: 'Enter your email and password.',
      type: 'error',
    });
  });

  it('registers with email and verifies the emailed code before finalizing', async () => {
    mockSignUp.verifications.verifyEmailCode.mockImplementation(async () => {
      mockSignUp.status = 'complete';
      return { error: null };
    });
    const screen = render(<SignUpScreen />);

    fireEvent.changeText(screen.getByTestId('sign-up-email'), 'new@example.com');
    fireEvent.changeText(screen.getByTestId('sign-up-password'), 'correct-horse-battery');
    fireEvent.changeText(screen.getByTestId('sign-up-confirm-password'), 'correct-horse-battery');
    fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => expect(mockSignUp.verifications.sendEmailCode).toHaveBeenCalledTimes(1));
    fireEvent.changeText(screen.getByTestId('sign-up-verification-code'), '123456');
    fireEvent.press(screen.getByTestId('sign-up-verify'));

    await waitFor(() =>
      expect(mockSignUp.verifications.verifyEmailCode).toHaveBeenCalledWith({ code: '123456' }),
    );
    expect(mockSignUp.finalize).toHaveBeenCalledTimes(1);
  });

  it('keeps password reset in its dedicated screen', async () => {
    mockSignIn.create.mockResolvedValue({ error: null });
    mockSignIn.resetPasswordEmailCode.verifyCode.mockImplementation(async () => {
      mockSignIn.status = 'needs_new_password';
      return { error: null };
    });
    mockSignIn.resetPasswordEmailCode.submitPassword.mockImplementation(async () => {
      mockSignIn.status = 'complete';
      return { error: null };
    });

    const screen = render(<PasswordResetScreen />);

    fireEvent.changeText(screen.getByTestId('password-reset-email'), 'person@example.com');
    fireEvent.press(screen.getByTestId('password-reset-request'));

    await waitFor(() =>
      expect(mockSignIn.create).toHaveBeenCalledWith({ identifier: 'person@example.com' }),
    );
    expect(mockSignIn.resetPasswordEmailCode.sendCode).toHaveBeenCalledTimes(1);

    fireEvent.changeText(screen.getByTestId('password-reset-code'), '123456');
    fireEvent.press(screen.getByTestId('password-reset-verify'));
    await waitFor(() =>
      expect(mockSignIn.resetPasswordEmailCode.verifyCode).toHaveBeenCalledWith({ code: '123456' }),
    );

    fireEvent.changeText(screen.getByTestId('password-reset-new-password'), 'new-password');
    fireEvent.press(screen.getByTestId('password-reset-submit'));
    await waitFor(() =>
      expect(mockSignIn.resetPasswordEmailCode.submitPassword).toHaveBeenCalledWith({
        password: 'new-password',
      }),
    );
    expect(mockSignIn.finalize).toHaveBeenCalledTimes(1);
  });
});
