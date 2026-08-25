import { render } from '@testing-library/react-native';

import { LibraryFilters } from './library-filters';

describe('LibraryFilters', () => {
  it('centers filter labels inside their touch targets', () => {
    const screen = render(
      <LibraryFilters
        categories={[]}
        favoritesOnly
        onCategoryChange={jest.fn()}
        onFavoritesOnlyChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId('library-filter-All')).toHaveStyle({ justifyContent: 'center' });
    expect(screen.getByTestId('library-filter-Favorites')).toHaveStyle({
      justifyContent: 'center',
    });
  });
});
