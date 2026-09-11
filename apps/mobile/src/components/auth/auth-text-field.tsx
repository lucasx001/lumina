import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthTextFieldProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'keyboardType'
  | 'onChangeText'
  | 'onSubmitEditing'
  | 'returnKeyType'
  | 'secureTextEntry'
  | 'textContentType'
  | 'value'
> & {
  error?: string;
  label: string;
  placeholder: string;
  testID?: string;
};

export function AuthTextField({
  error,
  label,
  onChangeText,
  onSubmitEditing,
  placeholder,
  secureTextEntry,
  testID,
  value,
  ...inputProps
}: AuthTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const theme = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <ThemedText style={{ fontSize: 12, fontWeight: '700' }} variant="caption">
        {label}
      </ThemedText>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedText}
        secureTextEntry={secureTextEntry}
        selectionColor={theme.primary}
        style={{
          backgroundColor: theme.surface,
          borderColor: error ? theme.error : focused ? theme.primary : theme.border,
          borderCurve: 'continuous',
          borderRadius: 10,
          borderWidth: 1,
          color: theme.text,
          fontFamily: theme.fontFamily,
          fontSize: 15,
          minHeight: 54,
          paddingHorizontal: 14,
          paddingVertical: 0,
        }}
        testID={testID}
        value={value}
      />
      {error ? (
        <ThemedText style={{ color: theme.error }} variant="caption">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
