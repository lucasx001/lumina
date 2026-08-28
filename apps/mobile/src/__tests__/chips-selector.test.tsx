import { fireEvent, render } from '@testing-library/react-native';

import { ChipsSelector } from '@/features/create/chips-selector';

describe('ChipsSelector', () => {
  it('selects and deselects a finite chip option', () => {
    const onChange = jest.fn();
    const screen = render(<ChipsSelector onChange={onChange} values={{}} />);

    expect(screen.getByTestId('chip-theme-nature')).toHaveStyle({ justifyContent: 'center' });
    fireEvent.press(screen.getByTestId('chip-theme-nature'));
    expect(onChange).toHaveBeenLastCalledWith('theme', 'nature');

    screen.rerender(<ChipsSelector onChange={onChange} values={{ theme: 'nature' }} />);
    fireEvent.press(screen.getByTestId('chip-theme-nature'));
    expect(onChange.mock.calls[1]).toEqual(['theme', undefined]);
  });
});
