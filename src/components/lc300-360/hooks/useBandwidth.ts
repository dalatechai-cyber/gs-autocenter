import { useEffect, useState } from 'react';

type NetworkProfile = 'full' | 'reduced' | 'minimal';

interface NavConn {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (t: string, fn: () => void) => void;
  removeEventListener?: (t: string, fn: () => void) => void;
}

export function useBandwidth(): NetworkProfile {
  const [profile, setProfile] = useState<NetworkProfile>('full');

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const conn = (navigator as unknown as { connection?: NavConn }).connection;

    const compute = (): NetworkProfile => {
      if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return 'minimal';
      if (!conn) return 'full';
      if (conn.saveData) return 'minimal';
      switch (conn.effectiveType) {
        case 'slow-2g':
        case '2g':       return 'minimal';
        case '3g':       return 'reduced';
        default:         return 'full';
      }
    };

    setProfile(compute());
    const handler = () => setProfile(compute());
    conn?.addEventListener?.('change', handler);
    return () => conn?.removeEventListener?.('change', handler);
  }, []);

  return profile;
}
