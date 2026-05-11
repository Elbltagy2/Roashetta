import { Bonjour, Service } from 'bonjour-service';

export interface DiscoveredScanner {
  name: string;
  host: string;
  port: number;
  url: string;
  secure: boolean;
}

interface ServiceTxt {
  rs?: string;
  ty?: string;
  note?: string;
  [key: string]: string | undefined;
}

function buildScannerUrl(svc: Service, secure: boolean): { url: string; host: string } {
  const txt = (svc.txt as ServiceTxt | undefined) ?? {};
  const rs = (txt.rs ?? 'eSCL').replace(/^\/+/, '');

  // Prefer first IPv4 address; fall back to hostname
  let host = svc.host;
  if (svc.addresses && svc.addresses.length > 0) {
    const ipv4 = svc.addresses.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
    host = ipv4 || svc.addresses[0];
  }

  const proto = secure ? 'https' : 'http';
  const url = `${proto}://${host}:${svc.port}/${rs}`;
  return { url, host };
}

/**
 * Discover eSCL-compatible network scanners on the local LAN via mDNS.
 * Browses both `_uscan._tcp` (HTTP) and `_uscans._tcp` (HTTPS) for `timeoutMs`.
 */
export function discoverScanners(timeoutMs = 4000): Promise<DiscoveredScanner[]> {
  return new Promise((resolve) => {
    const bonjour = new Bonjour();
    const found = new Map<string, DiscoveredScanner>();

    const onUp = (secure: boolean) => (svc: Service) => {
      try {
        const { url, host } = buildScannerUrl(svc, secure);
        const txt = (svc.txt as ServiceTxt | undefined) ?? {};
        const name = txt.ty || svc.name || 'Network scanner';
        if (!found.has(url)) {
          found.set(url, { name, host, port: svc.port, url, secure });
        }
      } catch {
        // Ignore malformed advertisements
      }
    };

    const browser1 = bonjour.find({ type: 'uscan' }, onUp(false));
    const browser2 = bonjour.find({ type: 'uscans' }, onUp(true));

    setTimeout(() => {
      try { browser1.stop(); } catch { /* noop */ }
      try { browser2.stop(); } catch { /* noop */ }
      try { bonjour.destroy(); } catch { /* noop */ }
      resolve(Array.from(found.values()));
    }, timeoutMs);
  });
}
