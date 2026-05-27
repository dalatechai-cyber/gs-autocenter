export const MANIFEST_URL = '/models/lc300-360/manifest.json';

export function framePath(_unused: string, frameIndex: number, pattern: string): string {
  return pattern.replace('{NNN}', String(frameIndex).padStart(3, '0'));
}
