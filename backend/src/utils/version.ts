// Bumped per release. Keep in sync with package.json. The updater compares
// this against the remote manifest to decide if a download is needed.
export const APP_VERSION = '1.3.0';

export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

export function isNewerVersion(current: string, candidate: string): boolean {
  return compareVersions(candidate, current) === 1;
}
