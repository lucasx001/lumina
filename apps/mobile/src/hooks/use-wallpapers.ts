import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getWallpapers,
  setWallpaperFavorite,
  type WallpaperListItem,
  type WallpapersResponse,
} from '@/lib/api';
import { useAuth as useClerkAuth } from '@clerk/expo';
import {
  getAccountSession,
  isCurrentAccount,
  requireCurrentAccount,
  type AccountSession,
} from '@/lib/account-session';

const defaultPageSize = 20;

export type WallpaperFilters = {
  categoryId?: string;
  favoritesOnly?: boolean;
};

export function useWallpapers(filters: WallpaperFilters = {}, pageSize = defaultPageSize) {
  const { userId } = useClerkAuth();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery<WallpapersResponse, Error>({
    enabled: Boolean(userId),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('An authenticated account is required to load wallpapers.');
      }

      return getWallpapers({
        categoryId: filters.categoryId,
        favorite: filters.favoritesOnly ? true : undefined,
        limit: pageSize,
        page: Number(pageParam),
      });
    },
    queryKey: ['wallpapers', userId, filters.categoryId, Boolean(filters.favoritesOnly), pageSize],
  });
  const favoriteMutation = useMutation({
    mutationFn: async ({
      account,
      favorite,
      id,
    }: {
      account: AccountSession;
      favorite: boolean;
      id: string;
    }) => {
      requireCurrentAccount(account);
      return setWallpaperFavorite(id, { favorite });
    },
    onSuccess: async (_, { account }) => {
      if (!isCurrentAccount(account)) return;
      await queryClient.invalidateQueries({ queryKey: ['wallpapers', account.accountId] });
    },
  });
  const wallpapers = query.data?.pages.flatMap((page) => page.items) ?? [];
  const favoriteBelongsToCurrentAccount = Boolean(
    favoriteMutation.variables && isCurrentAccount(favoriteMutation.variables.account),
  );

  return {
    ...query,
    accountId: userId,
    favoriteError: favoriteBelongsToCurrentAccount ? favoriteMutation.error : null,
    isUpdatingFavorite: Boolean(favoriteMutation.isPending && favoriteBelongsToCurrentAccount),
    toggleFavorite: (wallpaper: WallpaperListItem) => {
      const account = getAccountSession();
      if (!userId || !isCurrentAccount(account) || account.accountId !== userId) return;
      favoriteMutation.mutate({ account, favorite: !wallpaper.favorite, id: wallpaper.id });
    },
    wallpapers,
  };
}

export type WallpaperItem = WallpaperListItem;
