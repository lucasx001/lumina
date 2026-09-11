import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getWallpapers,
  setWallpaperFavorite,
  type WallpaperListItem,
  type WallpapersResponse,
} from '@/lib/api';
import { useAuth as useClerkAuth } from '@clerk/expo';

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
    mutationFn: async ({ favorite, id }: { favorite: boolean; id: string }) => {
      if (!userId) {
        throw new Error('An authenticated account is required to favorite a wallpaper.');
      }

      return setWallpaperFavorite(id, { favorite });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallpapers'] });
    },
  });
  const wallpapers = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    ...query,
    accountId: userId,
    favoriteError: favoriteMutation.error,
    isUpdatingFavorite: favoriteMutation.isPending,
    toggleFavorite: (wallpaper: WallpaperListItem) =>
      favoriteMutation.mutate({ favorite: !wallpaper.favorite, id: wallpaper.id }),
    wallpapers,
  };
}

export type WallpaperItem = WallpaperListItem;
