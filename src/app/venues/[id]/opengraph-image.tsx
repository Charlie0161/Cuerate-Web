import { ImageResponse } from 'next/og';
import { createClient } from '../../../lib/supabase-server';

export const runtime = 'edge';
export const alt = 'Venue on Cuerate';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ACCENT = '#7C5CFC';
const WARNING = '#F5A623';
const BG = '#0A0A0C';
const SURFACE = '#13131A';
const BORDER = '#2A2A38';
const TEXT = '#F0EFF8';
const TEXT_SEC = '#8A89A0';
const TEXT_MUTED = '#52516A';

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: venue } = await supabase
    .from('venues')
    .select('name, city, description, genres, rating_avg, review_count, capacity')
    .eq('id', params.id)
    .single();

  const name = venue?.name ?? 'Cuerate Venue';
  const city = venue?.city ?? null;
  const rating = venue?.rating_avg ? Number(venue.rating_avg).toFixed(1) : null;
  const reviews = venue?.review_count ?? 0;
  const genres = venue?.genres?.slice(0, 3) ?? [];

  const stats = [
    rating ? `★ ${rating}` : null,
    reviews > 0 ? `${reviews} review${reviews !== 1 ? 's' : ''}` : null,
    city,
  ].filter(Boolean) as string[];

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: BG, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${WARNING}22 0%, transparent 70%)`, display: 'flex' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${BORDER}18 1px, transparent 1px), linear-gradient(90deg, ${BORDER}18 1px, transparent 1px)`, backgroundSize: '60px 60px', display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', padding: '52px 64px', flex: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ACCENT}20`, border: `1.5px solid ${ACCENT}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎛</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: TEXT, letterSpacing: '0.16em' }}>CUERATE</span>
                <span style={{ fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.2em', marginTop: 1 }}>DJ COMPANION</span>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: WARNING, background: `${WARNING}18`, border: `1px solid ${WARNING}40`, borderRadius: 8, padding: '6px 16px', display: 'flex' }}>VENUE</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 48, flex: 1 }}>
            <div style={{ width: 160, height: 160, borderRadius: 24, background: `linear-gradient(135deg, #1C1C26 0%, ${WARNING}30 100%)`, border: `3px solid ${WARNING}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>🏢</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div style={{ fontSize: name.length > 24 ? 40 : 52, fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>{name}</div>
              {genres.length > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {genres.map((g: string, i: number) => <div key={i} style={{ fontSize: 16, fontWeight: 600, color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: 8, padding: '4px 12px', display: 'flex' }}>{g}</div>)}
                </div>
              )}
              {stats.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  {stats.map((s, i) => <div key={i} style={{ fontSize: 16, fontWeight: 600, color: TEXT_SEC, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 14px', display: 'flex' }}>{s}</div>)}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: `1px solid ${BORDER}`, marginTop: 32 }}>
            <span style={{ fontSize: 15, color: TEXT_MUTED }}>cuerate.co.uk/venues</span>
            <span style={{ fontSize: 14, color: TEXT_MUTED, fontStyle: 'italic' }}>Crowdsourced DJ venue ratings</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
