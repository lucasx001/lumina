import { usePasswordResetStore } from './password-reset-store';
import { useSignInStore } from './sign-in-store';
import { useSignUpStore } from './sign-up-store';

describe('authentication flow stores', () => {
  beforeEach(() => {
    usePasswordResetStore.getState().reset();
    useSignInStore.getState().reset();
    useSignUpStore.getState().reset();
  });

  it('keeps sign-in input in the client store', () => {
    useSignInStore.getState().setEmailAddress('person@example.com');
    useSignInStore.getState().setPassword('secret');

    expect(useSignInStore.getState()).toMatchObject({
      emailAddress: 'person@example.com',
      password: 'secret',
    });
  });

  it('keeps sign-up input and verification stage in the client store', () => {
    useSignUpStore.getState().setEmailAddress('new@example.com');
    useSignUpStore.getState().setPassword('secret');
    useSignUpStore.getState().setConfirmPassword('secret');
    useSignUpStore.getState().setCode('123456');
    useSignUpStore.getState().setIsVerifying(true);

    expect(useSignUpStore.getState()).toMatchObject({
      code: '123456',
      confirmPassword: 'secret',
      emailAddress: 'new@example.com',
      isVerifying: true,
      password: 'secret',
    });
  });

  it('resets password reset input and stage', () => {
    const store = usePasswordResetStore.getState();
    store.setEmailAddress('person@example.com');
    store.setCode('123456');
    store.setPassword('new-secret');
    store.setStage('password');

    store.reset();

    expect(usePasswordResetStore.getState()).toMatchObject({
      code: '',
      emailAddress: '',
      password: '',
      stage: 'request',
    });
  });
});
