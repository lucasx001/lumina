import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useRecentJobs } from '@/hooks/use-generation-recovery';
import { useGenerationStore } from '@/stores/generation-store';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { ErrorState } from '@/components/feedback';
import { spacing } from '@/constants/theme';

export function GenerationTasks() {
  const query = useRecentJobs();
  const router = useRouter();
  const { t } = useLingui();
  const isSubmitting = useGenerationStore((state) => state.sessions.create.isSubmitting);
  const jobs = query.data?.jobs ?? [];
  const active = jobs.filter((job) => job.status === 'pending' || job.status === 'processing');
  const latestFinished = jobs.find((job) => job.status === 'succeeded' || job.status === 'failed');
  const visible = [...active, ...(latestFinished ? [latestFinished] : [])];
  if (query.error) return <ErrorState message={query.error} onRetry={() => void query.refetch()} />;
  if (!visible.length) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <ThemedText variant="subtitle">
        <Trans>Recent creations</Trans>
      </ThemedText>
      {visible.map((job) => (
        <Button
          disabled={isSubmitting}
          key={job.wallpaperId}
          variant="secondary"
          label={`${job.category ?? t`Wallpaper`} · ${job.status === 'succeeded' ? t`Saved` : job.status === 'failed' ? t`Failed — view details` : t`Generating…`}`}
          onPress={() => {
            if (!job.wallpaperId) return;
            useGenerationStore.getState().reset('create');
            useGenerationStore.getState().setJobId('create', job.wallpaperId);
            router.push('/create-wallpaper');
          }}
        />
      ))}
    </View>
  );
}
