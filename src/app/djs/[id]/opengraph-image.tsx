import { ImageResponse } from 'next/og';
import { createClient } from '../../../lib/supabase-server';

export const runtime = 'edge';
export const alt = 'DJ Profile on Cuerate';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ACCENT = '#7C5CFC';
const ACCENT_DIM = '#3D2E8A';
const BG = '#0A0A0C';
const SURFACE = '#13131A';
const BORDER = '#2A2A38';
const TEXT = '#F0EFF8';
const TEXT_SEC = '#8A89A0';
const TEXT_MUTED = '#52516A';

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('dj_name, bio, genre, location, avatar_url')
    .eq('id', params.id)
    .eq('is_public', true)
    .single();

  const { count: mixCount } = await supabase
    .from('mix_feed')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', params.id);

  const name = profile?.dj_name ?? 'Cuerate DJ';
  const genre = profile?.genre ?? null;
  const location = profile?.location ?? null;
  const avatar = profile?.avatar_url ?? null;
  const mixes = mixCount ?? 0;
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const stats = [
    mixes > 0 ? `${mixes} mix${mixes !== 1 ? 'es' : ''}` : null,
    location,
  ].filter(Boolean) as string[];

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: BG, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${ACCENT}28 0%, transparent 70%)`, display: 'flex' }} />
        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${BORDER}18 1px, transparent 1px), linear-gradient(90deg, ${BORDER}18 1px, transparent 1px)`, backgroundSize: '60px 60px', display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', padding: '52px 64px', flex: 1, position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ACCENT}20`, border: `1.5px solid ${ACCENT}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎛</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: TEXT, letterSpacing: '0.16em' }}>CUERATE</span>
                <span style={{ fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.2em', marginTop: 1 }}>DJ COMPANION</span>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, background: `${ACCENT}18`, border: `1px solid ${ACCENT}40`, borderRadius: 8, padding: '6px 16px', display: 'flex' }}>DJ PROFILE</div>
          </div>

          {/* Avatar + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 48, flex: 1 }}>
            {avatar ? (
              <img src={avatar} width={160} height={160} style={{ borderRadius: 80, objectFit: 'cover', border: `3px solid ${ACCENT}60` }} alt="" />
            ) : (
              <div style={{ width: 160, height: 160, borderRadius: 80, background: `linear-gradient(135deg, ${ACCENT_DIM} 0%, ${ACCENT}50 100%)`, border: `3px solid ${ACCENT}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 800, color: TEXT }}>{initials}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div style={{ fontSize: name.length > 20 ? 44 : 56, fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>{name}</div>
              {genre && <div style={{ fontSize: 22, color: ACCENT, fontWeight: 600, background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: 8, padding: '4px 14px', alignSelf: 'flex-start', display: 'flex' }}>{genre}</div>}
              {stats.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  {stats.map((s, i) => <div key={i} style={{ fontSize: 16, fontWeight: 600, color: TEXT_SEC, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 14px', display: 'flex' }}>{s}</div>)}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: `1px solid ${BORDER}`, marginTop: 32 }}>
            <span style={{ fontSize: 15, color: TEXT_MUTED }}>cuerate.co.uk/djs</span>
            <span style={{ fontSize: 14, color: TEXT_MUTED, fontStyle: 'italic' }}>The DJ companion app</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
