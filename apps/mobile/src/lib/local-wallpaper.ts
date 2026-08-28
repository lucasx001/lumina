import { File, Paths } from 'expo-file-system';

function extensionFromUrl(imageUrl: string) {
  const path = imageUrl.split('?')[0] ?? '';
  const extension = path.match(/\.([a-zA-Z0-9]{2,5})$/)?.[1];
  return extension ? `.${extension}` : '.jpg';
}

/** Downloads a generated remote image into the app cache for native platform APIs. */
export async function downloadWallpaper(imageUrl: string) {
  if (!imageUrl.startsWith('https://') && !imageUrl.startsWith('http://')) {
    throw new TypeError('A remote wallpaper URL is required.');
  }

  const destination = new File(
    Paths.cache,
    `lumina-wallpaper-${Date.now()}${extensionFromUrl(imageUrl)}`,
  );
  const file = await File.downloadFileAsync(imageUrl, destination);
  return file.uri;
}
