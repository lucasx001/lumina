import { fireEvent, render } from '@testing-library/react-native';

import { QualitySelector } from '@/components/create';

describe('QualitySelector', () => {
  it('switches from the fast draft tier to the full-resolution tier', () => {
    const onChange = jest.fn();
    const screen = render(<QualitySelector onChange={onChange} value="draft" />);

    expect(screen.getByTestId('quality-draft').props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByTestId('quality-hd'));

    expect(onChange).toHaveBeenCalledWith('hd');
  });
});
