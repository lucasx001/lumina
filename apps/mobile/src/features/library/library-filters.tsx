import { useLingui } from '@lingui/react/macro';
import { Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LibraryFiltersProps = {
  categories: string[];
  favoritesOnly: boolean;
  onCategoryChange: (category: string | undefined) => void;
  onFavoritesOnlyChange: (value: boolean) => void;
  selectedCategory?: string;
};

export function LibraryFilters({
  categories,
  favoritesOnly,
  onCategoryChange,
  onFavoritesOnlyChange,
  selectedCategory,
}: LibraryFiltersProps) {
  const { t } = useLingui();
  const theme = useTheme();
  const allLabel = t`All`;
  const options = [
    { label: allLabel, value: undefined },
    ...categories.map((value) => ({ label: value, value })),
  ];

  return (
    <View style={{ gap: spacing.sm }}>
      <ScrollView horizontal>
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: 2 }}>
          {options.map((option) => {
            const selected = selectedCategory === option.value;
            return (
              <FilterChip
                key={option.value ?? 'all'}
                label={option.label}
                onPress={() => onCategoryChange(option.value)}
                selected={selected}
                theme={theme}
              />
            );
          })}
          <FilterChip
            label={t`Favorites`}
            onPress={() => onFavoritesOnlyChange(!favoritesOnly)}
            selected={favoritesOnly}
            theme={theme}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function FilterChip({
  label,
  onPress,
  selected,
  theme,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: selected ? theme.primary : theme.surface,
        borderColor: selected ? theme.primary : theme.border,
        borderCurve: 'continuous',
        borderRadius: radius.full,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 44,
        opacity: pressed ? 0.84 : 1,
        paddingHorizontal: spacing.md,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
      testID={`library-filter-${label}`}
    >
      <ThemedText
        style={{ color: selected ? theme.primaryForeground : theme.text }}
        variant="caption"
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
