import { colors } from '@/constants/theme';

import { createTabBarStyle } from './tab-bar-options';
import { createTabStackScreenOptions } from './tab-stack-options';

describe('createTabStackScreenOptions', () => {
  it('enables a themed native header for tab stacks', () => {
    const options = createTabStackScreenOptions({
      ...colors.light,
      displayFontFamily: 'Georgia',
      fontFamily: 'System',
    });

    expect(options).toMatchObject({
      contentStyle: { backgroundColor: colors.light.background },
      headerBackButtonDisplayMode: 'minimal',
      headerShadowVisible: false,
      headerShown: true,
      headerStyle: { backgroundColor: colors.light.background },
      headerTintColor: colors.light.primary,
      headerTitleStyle: { fontFamily: 'System' },
    });
  });

  it('keeps the tab bar height consistent across tab screens', () => {
    expect(
      createTabBarStyle({
        ...colors.dark,
        displayFontFamily: 'Georgia',
        fontFamily: 'System',
      }),
    ).toMatchObject({
      height: 68,
      paddingBottom: 8,
      paddingTop: 8,
    });
  });
});
