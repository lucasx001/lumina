import { fireEvent, render } from '@testing-library/react-native';

import { ResultView } from './result-view';

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Image: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});

jest.mock('@/features/apply/ApplySheet', () => ({
  ApplySheet: () => null,
}));

describe('ResultView', () => {
  const job = {
    height: 2400,
    resultImageUrl: 'https://images.example/wallpaper.jpg',
    status: 'succeeded' as const,
    width: 1080,
  };

  it('renders a generated image, switches preview modes, and regenerates', () => {
    const onRegenerate = jest.fn();
    const screen = render(<ResultView job={job} onRegenerate={onRegenerate} />);

    expect(screen.getByLabelText('Lock screen wallpaper preview')).toBeTruthy();
    expect(screen.getByTestId('preview-mode-lock-screen')).toHaveStyle({
      alignItems: 'center',
      justifyContent: 'center',
    });
    fireEvent.press(screen.getByTestId('preview-mode-home-screen'));
    expect(screen.getByLabelText('Home screen wallpaper preview')).toBeTruthy();
    fireEvent.press(screen.getByTestId('regenerate-button'));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('open-apply-sheet')).toBeTruthy();
  });
});
