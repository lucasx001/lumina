import { useLingui } from '@lingui/react/macro';
import { router, Tabs } from 'expo-router';
import { View } from 'react-native';

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
            <AppIcon color={color} name={tabIcons.home} size={size} />
          ),
          title: t`Home`,
        }}
      />
      <Tabs.Screen
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.push('/create-wallpaper');
          },
        }}
        name="(add)"
        options={{
          tabBarIcon: () => (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: theme.primary,
                borderColor: theme.primary,
                borderRadius: 999,
                borderWidth: 1,
                boxShadow: '0 10px 24px rgba(155, 91, 50, 0.3)',
                height: 58,
                justifyContent: 'center',
                transform: [{ translateY: -13 }],
                width: 58,
              }}
            >
              <AppIcon color={theme.primaryForeground} name={tabIcons.add} size={24} />
            </View>
          ),
          tabBarLabel: () => null,
          title: t`Add`,
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
