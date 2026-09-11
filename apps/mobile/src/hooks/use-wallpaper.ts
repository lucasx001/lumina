import { useAuth as useClerkAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getWallpaper, setWallpaperFavorite } from '@/lib/api';
import {
  getAccountSession,
  isCurrentAccount,
  requireCurrentAccount,
  type AccountSession,
} from '@/lib/account-session';

export function useWallpaper(id: string | undefined) {
  const { userId } = useClerkAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled: Boolean(userId && id),
    queryFn: () => {
      if (!id) {
        throw new Error('A wallpaper id is required.');
      }

      return getWallpaper(id);
    },
    queryKey: ['wallpaper', userId, id],
  });
  const favoriteMutation = useMutation({
    mutationFn: ({
      favorite,
      wallpaperId,
      account,
    }: {
      favorite: boolean;
      wallpaperId: string;
      account: AccountSession;
    }) => {
      requireCurrentAccount(account);
      return setWallpaperFavorite(wallpaperId, { favorite });
    },
    onSuccess: async (response, { account, wallpaperId }) => {
      if (!isCurrentAccount(account)) return;
      queryClient.setQueryData(['wallpaper', account.accountId, wallpaperId], response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallpapers', account.accountId] }),
        queryClient.invalidateQueries({ queryKey: ['categories', account.accountId] }),
      ]);
    },
  });

  return {
    ...query,
    favoriteError:
      favoriteMutation.variables &&
      isCurrentAccount(favoriteMutation.variables.account) &&
      favoriteMutation.variables.wallpaperId === id
        ? favoriteMutation.error
        : null,
    isUpdatingFavorite: Boolean(
      favoriteMutation.isPending &&
      isCurrentAccount(favoriteMutation.variables.account) &&
      favoriteMutation.variables.wallpaperId === id,
    ),
    toggleFavorite: () => {
      const favorite = query.data?.wallpaper.favorite;
      if (favorite !== undefined && id && !favoriteMutation.isPending) {
        favoriteMutation.mutate({
          favorite: !favorite,
          wallpaperId: id,
          account: getAccountSession(),
        });
      }
    },
    wallpaper: query.data?.wallpaper,
  };
}
