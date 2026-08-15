// MUST be imported first in App.tsx — installs global JS error handler
// before any other module's top-level code runs, so init crashes are visible.
const _errors: string[] = [];

try {
  const prev = (ErrorUtils as any).getGlobalHandler?.();
  (ErrorUtils as any).setGlobalHandler((err: any, isFatal: boolean) => {
    _errors.push(`[${isFatal ? 'FATAL' : 'error'}] ${err?.message ?? String(err)}\n${err?.stack ?? ''}`);
    if (prev) try { prev(err, isFatal); } catch {}
  });
} catch {}

export function getInitErrors(): string[] {
  return _errors;
}
