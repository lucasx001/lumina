import { useLingui } from '@lingui/react/macro';

import { TabStack } from '@/navigation/tab-stack';

export default function ProfileStackLayout() {
  const { t } = useLingui();

  return <TabStack title={t`Profile`} />;
}
