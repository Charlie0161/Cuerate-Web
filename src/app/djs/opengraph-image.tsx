import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'DJ Directory on Cuerate';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ACCENT = '#7C5CFC';
const BG = '#0A0A0C';
const BORDER = '#2A2A38';
const TEXT = '#F0EFF8';
const TEXT_MUTED = '#52516A';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: BG, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ position: 'absolute', top: -120, right: -80, width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${ACCENT}28 0%, transparent 70%)`, display: 'flex' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${BORDER}18 1px, transparent 1px), linear-gradient(90deg, ${BORDER}18 1px, transparent 1px)`, backgroundSize: '60px 60px', display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', padding: '52px 64px', flex: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ACCENT}20`, border: `1.5px solid ${ACCENT}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎛</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: TEXT, letterSpacing: '0.16em' }}>CUERATE</span>
              <span style={{ fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.2em', marginTop: 1 }}>DJ COMPANION</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', display: 'flex' }}>🎧 DJ DIRECTORY</div>
            <div style={{ fontSize: 68, fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>Discover DJs near you.</div>
            <div style={{ fontSize: 22, color: '#8A89A0', lineHeight: 1.5 }}>Browse public DJ profiles, mixes, tracks and booking contacts.</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: `1px solid ${BORDER}`, marginTop: 32 }}>
            <span style={{ fontSize: 15, color: TEXT_MUTED }}>cuerate.co.uk/djs</span>
            <span style={{ fontSize: 14, color: TEXT_MUTED, fontStyle: 'italic' }}>The DJ companion app</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
