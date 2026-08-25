import { create } from 'zustand';

export type PasswordResetStage = 'request' | 'verify' | 'password';

type PasswordResetState = {
  code: string;
  emailAddress: string;
  password: string;
  stage: PasswordResetStage;
};

type PasswordResetActions = {
  reset: () => void;
  setCode: (code: string) => void;
  setEmailAddress: (emailAddress: string) => void;
  setPassword: (password: string) => void;
  setStage: (stage: PasswordResetStage) => void;
};

export type PasswordResetStore = PasswordResetState & PasswordResetActions;

const initialPasswordResetState: PasswordResetState = {
  code: '',
  emailAddress: '',
  password: '',
  stage: 'request',
};

export const usePasswordResetStore = create<PasswordResetStore>()((set) => ({
  ...initialPasswordResetState,
  reset: () => set(initialPasswordResetState),
  setCode: (code) => set({ code }),
  setEmailAddress: (emailAddress) => set({ emailAddress }),
  setPassword: (password) => set({ password }),
  setStage: (stage) => set({ stage }),
}));
