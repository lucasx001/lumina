import { useLingui } from '@lingui/react/macro';

import { TabStack } from '@/navigation/tab-stack';

export default function CreateStackLayout() {
  const { t } = useLingui();

  return <TabStack title={t`Create`} />;
}
