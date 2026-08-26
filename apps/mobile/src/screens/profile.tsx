import { Trans, useLingui } from '@lingui/react/macro';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { radius, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/useAuth';
import { useAppLocale } from '@/features/i18n/i18n-provider';
import { useTheme } from '@/hooks/use-theme';

type ExpandedInformation = 'about' | 'privacy' | null;

export function ProfileScreen() {
  const [expandedInformation, setExpandedInformation] = useState<ExpandedInformation>(null);
  const { locale, setLocale } = useAppLocale();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLingui();
  const { authError, bindError, isLoaded, isSignedIn, isSyncingHistory, signOut, user } = useAuth();
  const googleAccount = useMemo(
    () =>
      user?.externalAccounts.find((account: { emailAddress?: string | null; provider: string }) =>
        account.provider.includes('google'),
      ),
    [user?.externalAccounts],
  );
  const displayName = isSignedIn
    ? (user?.fullName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? t`Signed in`)
    : t`Guest creator`;
  const accountDetail = isLoaded
    ? isSignedIn
      ? (googleAccount?.emailAddress ?? user?.primaryEmailAddress?.emailAddress)
      : t`Saved on this device`
    : t`Restoring sign-in state…`;

  const toggleInformation = (section: Exclude<ExpandedInformation, null>) => {
    setExpandedInformation((current) => (current === section ? null : section));
  };

  return (
    <ScrollView
      contentContainerStyle={{ gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xxl }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
        <View
          style={{
            alignItems: 'center',
            borderColor: theme.primary,
            borderRadius: radius.full,
            borderWidth: 3,
            boxShadow: shadows.raised,
            height: 104,
            justifyContent: 'center',
            padding: 4,
            width: 104,
          }}
        >
          {user?.imageUrl ? (
            <Image
              accessibilityLabel={t`Profile photo`}
              contentFit="cover"
              source={{ uri: user.imageUrl }}
              style={{ borderRadius: radius.full, height: '100%', width: '100%' }}
            />
          ) : (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: theme.card,
                borderRadius: radius.full,
                flex: 1,
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <AppIcon color={theme.primary} name="profile" size={52} />
            </View>
          )}
        </View>
        <ThemedText numberOfLines={1} style={{ textAlign: 'center' }} variant="title">
          {displayName}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          style={{ color: theme.mutedText, textAlign: 'center' }}
          variant="caption"
        >
          {accountDetail}
        </ThemedText>
        {isSyncingHistory ? (
          <ThemedText style={{ color: theme.primary }} variant="caption">
            <Trans>Syncing device history…</Trans>
          </ThemedText>
        ) : null}
      </View>

      {bindError || authError ? (
        <ThemedView variant="card" style={{ borderColor: theme.error }}>
          <ThemedText style={{ color: theme.error }} variant="caption">
            {(bindError ?? authError)?.message}
          </ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView variant="card" style={{ gap: 0, padding: spacing.sm }}>
        <ProfileMenuRow
          icon="library"
          label={t`My wallpapers`}
          onPress={() => router.navigate('/')}
        />
        <ProfileMenuRow
          expanded={expandedInformation === 'about'}
          icon="info"
          label={t`About Lumina`}
          onPress={() => toggleInformation('about')}
        />
        {expandedInformation === 'about' ? (
          <InformationPanel>
            <Trans>
              Lumina turns ideas and personal photos into device-sized wallpapers, with previews for
              both lock and home screens.
            </Trans>
          </InformationPanel>
        ) : null}
        <ProfileMenuRow
          expanded={expandedInformation === 'privacy'}
          icon="privacy"
          label={t`Privacy`}
          onPress={() => toggleInformation('privacy')}
        />
        {expandedInformation === 'privacy' ? (
          <InformationPanel>
            <Trans>
              An account is required to create and manage wallpapers. Your session also keeps
              wallpaper history connected across devices.
            </Trans>
          </InformationPanel>
        ) : null}
        <ProfileMenuRow
          icon="share"
          label={t`Share Lumina`}
          onPress={() =>
            void Share.share({
              message: t`Create personal wallpapers with Lumina.`,
            })
          }
        />
      </ThemedView>

      <ThemedView variant="card" style={{ gap: spacing.xs, padding: spacing.sm }}>
        <View style={{ gap: spacing.xs, padding: spacing.sm }}>
          <ThemedText variant="subtitle">
            <Trans>Language</Trans>
          </ThemedText>
          <ThemedText style={{ color: theme.mutedText }} variant="caption">
            <Trans>Your interface language is stored securely on this device.</Trans>
          </ThemedText>
        </View>
        <LanguageOption
          active={locale === 'en'}
          label="English"
          onPress={() => void setLocale('en')}
        />
        <LanguageOption
          active={locale === 'zh-CN'}
          label="简体中文"
          onPress={() => void setLocale('zh-CN')}
        />
      </ThemedView>

      {isLoaded && isSignedIn ? (
        <Button fullWidth label={t`Sign out`} onPress={() => void signOut()} variant="secondary" />
      ) : null}
    </ScrollView>
  );
}

function ProfileMenuRow({
  expanded = false,
  icon,
  label,
  onPress,
}: {
  expanded?: boolean;
  icon: AppIconName;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? theme.muted : 'transparent',
        borderRadius: radius.md,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 60,
        opacity: pressed ? 0.84 : 1,
        paddingHorizontal: spacing.sm,
      })}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.primary,
          borderRadius: radius.full,
          height: 40,
          justifyContent: 'center',
          width: 40,
        }}
      >
        <AppIcon color={theme.primaryForeground} name={icon} size={19} />
      </View>
      <ThemedText style={{ flex: 1 }} variant="body">
        {label}
      </ThemedText>
      <AppIcon color={theme.mutedText} name="chevron-right" size={17} />
    </Pressable>
  );
}

function InformationPanel({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.muted,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        marginHorizontal: spacing.sm,
        padding: spacing.md,
      }}
    >
      <ThemedText style={{ color: theme.mutedText }} variant="body">
        {children}
      </ThemedText>
    </View>
  );
}

function LanguageOption({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: active ? theme.muted : pressed ? theme.muted : 'transparent',
        borderCurve: 'continuous',
        borderRadius: radius.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 52,
        opacity: pressed ? 0.82 : 1,
        paddingHorizontal: spacing.sm,
      })}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: active ? theme.primary : theme.muted,
            borderRadius: radius.full,
            height: 36,
            justifyContent: 'center',
            width: 36,
          }}
        >
          <AppIcon color={active ? theme.primaryForeground : theme.mutedText} name="language" />
        </View>
        <ThemedText variant="body">{label}</ThemedText>
      </View>
      {active ? <AppIcon color={theme.primary} name="check" /> : null}
    </Pressable>
  );
}
