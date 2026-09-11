import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { fixedCreateSheetBehavior } from '@/lib/create-wallpaper-bottom-sheet';
import { radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CreateWallpaperScreen } from '@/screens/create-wallpaper';

export default function CreateWallpaperPage() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: 'rgba(20, 18, 15, 0.42)', flex: 1 }}>
      <BottomSheet
        {...fixedCreateSheetBehavior}
        backgroundStyle={{ backgroundColor: theme.surface, borderRadius: radius.lg }}
        index={0}
        onClose={() => router.back()}
        snapPoints={['82%']}
      >
        <CreateWallpaperScreen onClose={() => router.back()} />
      </BottomSheet>
    </View>
  );
}
