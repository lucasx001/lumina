/** A version changes even when the same account signs out and signs back in. */
export type AccountSession = { accountId: string | null; version: number; signal: AbortSignal };
let controller = new AbortController();
let current: AccountSession = { accountId: null, version: 0, signal: controller.signal };

export function getAccountSession(): AccountSession {
  return current;
}

export function changeAccountSession(accountId: string | null): void {
  if (current.accountId === accountId) return;
  controller.abort();
  controller = new AbortController();
  current = { accountId, version: current.version + 1, signal: controller.signal };
}

export function isCurrentAccount(session: AccountSession): boolean {
  return (
    session.accountId !== null && session.version === current.version && !session.signal.aborted
  );
}

export function requireCurrentAccount(session: AccountSession): void {
  if (!isCurrentAccount(session)) throw new Error('Account session changed. Please try again.');
}
