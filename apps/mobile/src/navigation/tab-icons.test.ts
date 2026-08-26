import { tabIcons } from './tab-icons';

describe('tabIcons', () => {
  it('declares an app icon for every standard tab', () => {
    expect(tabIcons).toEqual({
      add: 'plus',
      home: 'home',
      profile: 'profile',
    });
  });
});
