import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const BG = '#0A0A0C';
const SURFACE = '#13131A';
const BORDER = '#2A2A38';
const ACCENT = '#7C5CFC';
const ACCENT_DIM = '#3D2E8A';
const TEXT = '#F0EFF8';
const TEXT_SEC = '#8A89A0';
const TEXT_MUTED = '#52516A';
const SUCCESS = '#4DCC8F';
const WARNING = '#F5A623';

// Cuerate "C" logo path points
const LOGO_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 30 8 A 18 18 0 1 0 30 40" fill="none" stroke="${ACCENT}" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="30" cy="8" r="3.5" fill="${ACCENT}"/>
  <circle cx="30" cy="40" r="3.5" fill="#AFA9EC"/>
</svg>`;

type OGType = 'dj' | 'venue' | 'gig' | 'mix' | 'default';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const type = (searchParams.get('type') ?? 'default') as OGType;
  const name = searchParams.get('name') ?? '';
  const sub = searchParams.get('sub') ?? '';       // genre / city / venue name
  const stat1 = searchParams.get('stat1') ?? '';   // e.g. "12 mixes"
  const stat2 = searchParams.get('stat2') ?? '';   // e.g. "34 tracks"
  const stat3 = searchParams.get('stat3') ?? '';   // e.g. "London"
  const avatar = searchParams.get('avatar') ?? ''; // avatar URL for DJ/venue

  const typeConfig: Record<OGType, { label: string; color: string; icon: string }> = {
    dj:      { label: 'DJ Profile',    color: ACCENT,   icon: '🎧' },
    venue:   { label: 'Venue',         color: WARNING,  icon: '🏢' },
    gig:     { label: 'Gig Booking',   color: SUCCESS,  icon: '📢' },
    mix:     { label: 'Mix',           color: ACCENT,   icon: '🎵' },
    default: { label: 'Cuerate',       color: ACCENT,   icon: '🎛' },
  };

  const cfg = typeConfig[type];
  const initials = name
    ? name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : cfg.icon;

  const stats = [stat1, stat2, stat3].filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Gradient glow top-right */}
        <div style={{
          position: 'absolute', top: -120, right: -120,
          width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
          display: 'flex',
        }} />

        {/* Subtle grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${BORDER}18 1px, transparent 1px), linear-gradient(90deg, ${BORDER}18 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          display: 'flex',
        }} />

        {/* Main content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '52px 64px',
          flex: 1,
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Top bar: logo + type badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${ACCENT}20`,
                border: `1.5px solid ${ACCENT}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>🎛</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: TEXT, letterSpacing: '0.16em' }}>CUERATE</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: TEXT_MUTED, letterSpacing: '0.2em', marginTop: 1 }}>DJ COMPANION</span>
              </div>
            </div>

            {/* Type badge */}
            <div style={{
              fontSize: 13, fontWeight: 700, color: cfg.color,
              background: `${cfg.color}18`,
              border: `1px solid ${cfg.color}40`,
              borderRadius: 8, padding: '6px 16px',
              letterSpacing: '0.04em',
              display: 'flex',
            }}>
              {cfg.label.toUpperCase()}
            </div>
          </div>

          {/* Main row: avatar + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 48, flex: 1 }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  width={160}
                  height={160}
                  style={{ borderRadius: 80, objectFit: 'cover', border: `3px solid ${cfg.color}60` }}
                  alt=""
                />
              ) : (
                <div style={{
                  width: 160, height: 160, borderRadius: 80,
                  background: `linear-gradient(135deg, ${ACCENT_DIM} 0%, ${ACCENT}50 100%)`,
                  border: `3px solid ${cfg.color}60`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: name ? 52 : 64,
                  fontWeight: 800,
                  color: TEXT,
                }}>
                  {initials}
                </div>
              )}
            </div>

            {/* Text content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div style={{ fontSize: name.length > 20 ? 44 : 56, fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>
                {name || 'Cuerate'}
              </div>

              {sub && (
                <div style={{
                  fontSize: 22, color: cfg.color, fontWeight: 600,
                  background: `${cfg.color}12`,
                  border: `1px solid ${cfg.color}30`,
                  borderRadius: 8, padding: '4px 14px',
                  alignSelf: 'flex-start',
                  display: 'flex',
                }}>
                  {sub}
                </div>
              )}

              {stats.length > 0 && (
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  {stats.map((s, i) => (
                    <div key={i} style={{
                      fontSize: 16, fontWeight: 600, color: TEXT_SEC,
                      background: SURFACE,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8, padding: '6px 14px',
                      display: 'flex',
                    }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: `1px solid ${BORDER}`,
            marginTop: 32,
          }}>
            <span style={{ fontSize: 15, color: TEXT_MUTED }}>cuerate.co.uk</span>
            <span style={{ fontSize: 14, color: TEXT_MUTED, fontStyle: 'italic' }}>The DJ companion app</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
