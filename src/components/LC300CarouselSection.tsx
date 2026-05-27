import Image from 'next/image';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { LC300Carousel } from './lc300-360';
import type { Manifest } from './lc300-360/data/types';
import { SITE_URL } from '@/lib/site-url';

async function loadManifest(): Promise<Manifest | null> {
  try {
    const p = path.join(process.cwd(), 'public/models/lc300-360/manifest.json');
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}

// GS Auto Center is a service center, NOT a car dealer.
// Use AutoRepair (service business schema), not Vehicle (product/asset schema).
// AutoRepair signals to Google: "this is a business that services cars", which
// is what we want indexed for queries like "Toyota servis Ulaanbaatar".
const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AutoRepair',
  '@id': `${SITE_URL}/#business`,
  name: 'GS Auto Center',
  description: 'Toyota болон Lexus автомашины засвар үйлчилгээний төв. Хөдөлгүүр, түдгэлзүүр, цахилгаан, оношилгоо.',
  telephone: '+97677200570',
  url: SITE_URL,
  image: `${SITE_URL}/models/lc300-360/exterior/hero.webp`,
  areaServed: { '@type': 'AdministrativeArea', name: 'Ulaanbaatar' },
  knowsAbout: [
    'Toyota Land Cruiser 300',
    'Toyota Land Cruiser service',
    'Lexus service',
    'V35A-FTS engine',
    'Toyota suspension repair',
  ],
  makesOffer: [
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Toyota Land Cruiser 300 үйлчилгээ',
        description: 'Хөдөлгүүрийн оношилгоо, түдгэлзүүрийн засвар, тосны солилт, цахилгааны систем, бүх төрлийн засвар.',
      },
    },
  ],
};

export default async function LC300CarouselSection() {
  const manifest = await loadManifest();
  return (
    <section id="lc300-explorer" style={{ padding: '64px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24, color: '#f5f5f5' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Land Cruiser 300</h2>
        <p style={{ marginTop: 8, color: '#9a9aa0' }}>
          Машиныг эргүүлж, дотрыг нь нээж, доороос харна уу
        </p>
      </div>

      <noscript>
        {manifest && (
          <div style={{ display: 'grid', gap: 16 }}>
            {(Object.keys(manifest.stages) as (keyof typeof manifest.stages)[]).map((s) => (
              <Image
                key={s}
                src={manifest.stages[s].heroPath}
                alt={`Land Cruiser 300 — ${s}`}
                width={manifest.stages[s].width}
                height={manifest.stages[s].height}
                priority={s === 'exterior'}
              />
            ))}
          </div>
        )}
      </noscript>

      <LC300Carousel manifest={manifest ?? undefined} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
      />
    </section>
  );
}
