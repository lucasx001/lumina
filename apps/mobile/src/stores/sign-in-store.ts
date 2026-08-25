import { create } from 'zustand';

type SignInState = {
  emailAddress: string;
  password: string;
};

type SignInActions = {
  reset: () => void;
  setEmailAddress: (emailAddress: string) => void;
  setPassword: (password: string) => void;
};

export type SignInStore = SignInState & SignInActions;

const initialSignInState: SignInState = {
  emailAddress: '',
  password: '',
};

export const useSignInStore = create<SignInStore>()((set) => ({
  ...initialSignInState,
  reset: () => set(initialSignInState),
  setEmailAddress: (emailAddress) => set({ emailAddress }),
  setPassword: (password) => set({ password }),
}));
