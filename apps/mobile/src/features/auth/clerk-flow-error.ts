type ClerkFlowError = {
  longMessage?: string;
  message: string;
};

export function throwIfClerkError(error: ClerkFlowError | null): void {
  if (error) {
    throw new Error(error.longMessage ?? error.message);
  }
}

export function getAuthFlowError(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message.trim()) {
    return reason.message;
  }

  return fallback;
}
