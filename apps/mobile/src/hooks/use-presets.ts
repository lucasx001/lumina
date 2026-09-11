import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { getPresets } from '@/lib/api';

export function usePresets() {
  const { userId } = useAuth();
  return useQuery({ enabled: Boolean(userId), queryFn: getPresets, queryKey: ['presets', userId] });
}
