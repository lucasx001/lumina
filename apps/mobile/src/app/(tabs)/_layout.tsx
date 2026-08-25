import { useLingui } from '@lingui/react/macro';
import { Tabs } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';
import { createTabBarItemStyle, createTabBarStyle } from '@/navigation/tab-bar-options';
import { tabIcons } from '@/navigation/tab-icons';

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useLingui();

  return (
    <Tabs
      initialRouteName="(create)"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: theme.primary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: theme.mutedText,
        tabBarLabelStyle: { fontFamily: theme.fontFamily, fontSize: 11, fontWeight: '600' },
        tabBarStyle: createTabBarStyle(theme),
        tabBarItemStyle: createTabBarItemStyle(),
      }}
    >
      <Tabs.Screen
        name="(create)"
        options={{
          tabBarIcon: ({ color, size }) => (
            <AppIcon color={color} name={tabIcons.create} size={size} />
          ),
          title: t`Create`,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ color, size }) => (
            <AppIcon color={color} name={tabIcons.library} size={size} />
          ),
          title: t`Library`,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <AppIcon color={color} name={tabIcons.profile} size={size} />
          ),
          title: t`Profile`,
        }}
      />
    </Tabs>
  );
}
