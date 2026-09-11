import { changeAccountSession, getAccountSession, isCurrentAccount } from '@/lib/account-session';

describe('account sessions', () => {
  it('aborts old requests and rejects an old session after signing back into the same account', () => {
    changeAccountSession('user-a');
    const first = getAccountSession();
    changeAccountSession(null);
    changeAccountSession('user-a');
    expect(first.signal.aborted).toBe(true);
    expect(isCurrentAccount(first)).toBe(false);
    expect(isCurrentAccount(getAccountSession())).toBe(true);
  });
});
