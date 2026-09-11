import { Directory, File, Paths } from 'expo-file-system';
import { getAccountSession, requireCurrentAccount } from '@/lib/account-session';

function extensionFromUrl(imageUrl: string) {
  const path = imageUrl.split('?')[0] ?? '';
  const extension = path.match(/\.([a-zA-Z0-9]{2,5})$/)?.[1];
  return extension ? `.${extension}` : '.jpg';
}

/** Only this app-owned directory is removed; exported Photos assets are untouched. */
export function clearWallpaperDownloads(): void {
  const directory = new Directory(Paths.cache, 'lumina-wallpapers');
  if (directory.exists) directory.delete();
}

export async function withLocalWallpaper(
  imageUrl: string,
  action: (uri: string) => Promise<unknown>,
): Promise<void> {
  const account = getAccountSession();
  requireCurrentAccount(account);
  if (!imageUrl.startsWith('https://') && !imageUrl.startsWith('http://')) {
    throw new TypeError('A remote wallpaper URL is required.');
  }

  const directory = new Directory(Paths.cache, 'lumina-wallpapers', `${account.version}`);
  directory.create({ intermediates: true, idempotent: true });
  const destination = new File(
    directory,
    `${Date.now()}-${Math.random().toString(36).slice(2)}${extensionFromUrl(imageUrl)}`,
  );
  try {
    const file = await File.downloadFileAsync(imageUrl, destination);
    requireCurrentAccount(account);
    await action(file.uri);
  } finally {
    if (destination.exists) destination.delete();
  }
}
