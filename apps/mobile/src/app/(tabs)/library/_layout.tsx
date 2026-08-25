import { useLingui } from '@lingui/react/macro';

import { TabStack } from '@/navigation/tab-stack';

export default function LibraryStackLayout() {
  const { t } = useLingui();

  return <TabStack title={t`Library`} />;
}
