import { useAuth as useClerkAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createCategory, getCategories } from '@/lib/api';
import {
  getAccountSession,
  isCurrentAccount,
  requireCurrentAccount,
  type AccountSession,
} from '@/lib/account-session';

export function useCategories() {
  const { userId } = useClerkAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled: Boolean(userId),
    queryFn: getCategories,
    queryKey: ['categories', userId],
    retry: false,
  });
  const createMutation = useMutation({
    mutationFn: ({ name, account }: { name: string; account: AccountSession }) => {
      requireCurrentAccount(account);
      return createCategory(name);
    },
    onSuccess: async (_, { account }) => {
      if (!isCurrentAccount(account)) return;
      await queryClient.invalidateQueries({ queryKey: ['categories', account.accountId] });
    },
  });

  return {
    ...query,
    createCategory: (name: string) =>
      createMutation.mutateAsync({ name, account: getAccountSession() }),
    createCategoryError:
      createMutation.variables && isCurrentAccount(createMutation.variables.account)
        ? createMutation.error
        : null,
    isCreatingCategory: Boolean(
      createMutation.isPending && isCurrentAccount(createMutation.variables.account),
    ),
    categories: query.data?.categories ?? [],
  };
}
