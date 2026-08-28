import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  getWallpapers,
  setWallpaperFavorite,
  type WallpaperListItem,
  type WallpapersResponse,
} from '@/lib/api';
import { useAnonymousDeviceId } from '@/lib/device-id';

const defaultPageSize = 20;

export type WallpaperFilters = {
  category?: string;
  favoritesOnly?: boolean;
};

export function useWallpapers(filters: WallpaperFilters = {}, pageSize = defaultPageSize) {
  const anonymousDevice = useAnonymousDeviceId();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery<
    WallpapersResponse,
    Error,
    InfiniteData<WallpapersResponse>,
    [string, string | undefined, string | undefined, boolean, number],
    number
  >({
    enabled: Boolean(anonymousDevice.deviceId),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      if (!anonymousDevice.deviceId) {
        throw new Error('An anonymous device ID is required to load wallpapers.');
      }

      return getWallpapers({
        deviceId: anonymousDevice.deviceId,
        category: filters.category,
        favorite: filters.favoritesOnly ? true : undefined,
        limit: pageSize,
        page: pageParam,
      });
    },
    queryKey: [
      'wallpapers',
      anonymousDevice.deviceId,
      filters.category,
      Boolean(filters.favoritesOnly),
      pageSize,
    ],
  });
  const favoriteMutation = useMutation({
    mutationFn: async ({ favorite, id }: { favorite: boolean; id: string }) => {
      if (!anonymousDevice.deviceId) {
        throw new Error('An anonymous device ID is required to favorite a wallpaper.');
      }

      return setWallpaperFavorite(id, { deviceId: anonymousDevice.deviceId, favorite });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallpapers'] });
    },
  });
  const wallpapers = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    ...query,
    deviceId: anonymousDevice.deviceId,
    deviceIdError: anonymousDevice.error,
    isPreparingDeviceId: anonymousDevice.isLoading,
    favoriteError: favoriteMutation.error,
    isUpdatingFavorite: favoriteMutation.isPending,
    toggleFavorite: (wallpaper: WallpaperListItem) =>
      favoriteMutation.mutate({ favorite: !wallpaper.favorite, id: wallpaper.id }),
    wallpapers,
  };
}

export type WallpaperItem = WallpaperListItem;
