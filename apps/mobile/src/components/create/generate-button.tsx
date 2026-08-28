import { useLingui } from '@lingui/react/macro';

import { Button } from '@/components/ui';

type GenerateButtonProps = {
  disabled: boolean;
  isGenerating: boolean;
  onPress: () => void;
};

export function GenerateButton({ disabled, isGenerating, onPress }: GenerateButtonProps) {
  const { t } = useLingui();

  return (
    <Button
      disabled={disabled}
      fullWidth
      icon="sparkles"
      label={isGenerating ? t`Generating…` : t`Generate wallpaper`}
      loading={isGenerating}
      onPress={onPress}
      testID="generate-button"
    />
  );
}
