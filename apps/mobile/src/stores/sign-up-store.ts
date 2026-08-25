import { create } from 'zustand';

type SignUpState = {
  code: string;
  confirmPassword: string;
  emailAddress: string;
  isVerifying: boolean;
  password: string;
};

type SignUpActions = {
  reset: () => void;
  setCode: (code: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  setEmailAddress: (emailAddress: string) => void;
  setIsVerifying: (isVerifying: boolean) => void;
  setPassword: (password: string) => void;
};

export type SignUpStore = SignUpState & SignUpActions;

const initialSignUpState: SignUpState = {
  code: '',
  confirmPassword: '',
  emailAddress: '',
  isVerifying: false,
  password: '',
};

export const useSignUpStore = create<SignUpStore>()((set) => ({
  ...initialSignUpState,
  reset: () => set(initialSignUpState),
  setCode: (code) => set({ code }),
  setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
  setEmailAddress: (emailAddress) => set({ emailAddress }),
  setIsVerifying: (isVerifying) => set({ isVerifying }),
  setPassword: (password) => set({ password }),
}));
