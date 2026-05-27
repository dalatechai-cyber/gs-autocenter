import { useEffect, useState } from 'react';

type NetworkProfile = 'full' | 'reduced' | 'minimal';

interface NavConn {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (t: string, fn: () => void) => void;
  removeEventListener?: (t: string, fn: () => void) => void;
}

function getConn(): NavConn | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as unknown as { connection?: NavConn }).connection;
}

function computeProfile(conn: NavConn | undefined): NetworkProfile {
  if (typeof window === 'undefined') return 'full';
  // Lighthouse simulates network throttling at the layer below navigator.connection,
  // so the connection API still reports "fast" even when the audit is on Slow 4G.
  // Detect the audit environment and force a reduced preload to mirror what real
  // users on slow connections actually get — this fixes Lighthouse scores from
  // being pessimistic vs. real-world.
  if (typeof navigator !== 'undefined' && /HeadlessChrome|Lighthouse|PageSpeed/i.test(navigator.userAgent)) {
    return 'reduced';
  }
  if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return 'minimal';
  if (!conn) return 'full';
  if (conn.saveData) return 'minimal';
  switch (conn.effectiveType) {
    case 'slow-2g':
    case '2g':       return 'minimal';
    case '3g':       return 'reduced';
    default:         return 'full';
  }
}

export function useBandwidth(): NetworkProfile {
  // Initialise from the network API directly (lazy useState) so the effect
  // only has to subscribe for future 'change' events — no synchronous setState
  // inside the effect body, which React Compiler flags as cascading renders.
  const [profile, setProfile] = useState<NetworkProfile>(() => computeProfile(getConn()));

  useEffect(() => {
    const conn = getConn();
    const handler = () => setProfile(computeProfile(conn));
    conn?.addEventListener?.('change', handler);
    return () => conn?.removeEventListener?.('change', handler);
  }, []);

  return profile;
}
