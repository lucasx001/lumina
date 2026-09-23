import { Redirect } from 'expo-router';

export default function AddTabPlaceholder() {
  return <Redirect href="/(tabs)/(create)" />;
}
