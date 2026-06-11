'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient, DJProfile, Mix } from '../../../lib/supabase';
import Navbar from '../../../components/Navbar';
import MixCard from '../../../components/MixCard';
import AuthModal from '../../../components/AuthModal';

// ─── Track row (reuse tracks page pattern) ────────────────────────────────────

interface TrackSubmission {
  id: string;
  title: string;
  artist: string | null;
  bpm: number | null;
  camelot_key: string | null;
  energy: number | null;
  platform: string;
  external_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

const KEY_HUE: Record<string, string> = {
  '1':'#7C5CFC','2':'#9B59FC','3':'#B05AF5','4':'#C86EF0','5':'#D97BE8','6':'#E88CE0',
  '7':'#F49CD6','8':'#E8A0C8','9':'#D4A8D0','10':'#C0B0D8','11':'#AAB8E0','12':'#94C0E8',
};
const KEY_HUE_B: Record<string, string> = {
  '1':'#5C9CFC','2':'#5CB8FC','3':'#4CCCE0','4':'#3DDCC0','5':'#40DCA0','6':'#52E080',
  '7':'#6AE060','8':'#8EE040','9':'#B8E040','10':'#DCE040','11':'#ECC840','12':'#F0A040',
};
function keyColor(k: string) {
  const num = k.replace(/[AB]/, '');
  return k.endsWith('A') ? KEY_HUE[num] ?? '#7C5CFC' : KEY_HUE_B[num] ?? '#4DB8FF';
}

const PLATFORM_COLORS: Record<string, string> = {
  soundcloud: '#FF5500', youtube: '#FF0000', mixcloud: '#5000FF',
};

function TrackRow({ track }: { track: TrackSubmission }) {
  const col = track.camelot_key ? keyColor(track.camelot_key) : '#8A89A0';
  const platformCol = PLATFORM_COLORS[track.platform] ?? '#8A89A0';

  return (
    <a href={track.external_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 8,
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        {track.thumbnail_url ? (
          <img src={track.thumbnail_url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--raised)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18 }}>🎵</span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {track.title}
          </div>
          {track.artist && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{track.artist}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {track.camelot_key && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: col,
              background: col + '20', border: `1px solid ${col}50`,
              borderRadius: 5, padding: '2px 7px',
            }}>{track.camelot_key}</span>
          )}
          {track.bpm && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-sec)',
              background: 'var(--raised)', borderRadius: 5, padding: '2px 7px',
            }}>{Math.round(track.bpm)} BPM</span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 700, color: platformCol,
            background: platformCol + '18', border: `1px solid ${platformCol}40`,
            borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize',
          }}>{track.platform}</span>
        </div>
      </div>
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DJProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [dj, setDj] = useState<DJProfile | null>(null);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [tracks, setTracks] = useState<TrackSubmission[]>([]);
  const [tab, setTab] = useState<'mixes' | 'tracks'>('mixes');
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    if (id) load(id);
  }, [id]);

  async function load(djId: string) {
    setLoading(true);
    const [profileRes, mixesRes, tracksRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, dj_name, avatar_url, bio, genre, location, soundcloud_url, booking_email, is_pro, account_type')
        .eq('id', djId)
        .eq('is_public', true)
        .single(),
      supabase
        .from('mix_feed')
        .select('*')
        .eq('user_id', djId)
        .order('created_at', { ascending: false }),
      supabase
        .from('track_submissions')
        .select('id, title, artist, bpm, camelot_key, energy, platform, external_url, thumbnail_url, created_at')
        .eq('submitted_by', djId)
        .eq('status', 'ready')
        .order('created_at', { ascending: false }),
    ]);

    if (!profileRes.data) { setNotFound(true); setLoading(false); return; }
    setDj(profileRes.data);
    setMixes(mixesRes.data ?? []);
    setTracks(tracksRes.data ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar session={session} onUpload={() => {}} onAuth={() => setShowAuth(true)} onSignOut={() => supabase.auth.signOut()} />
        <div style={{ textAlign: 'center', padding: 100, color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  if (notFound || !dj) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar session={session} onUpload={() => {}} onAuth={() => setShowAuth(true)} onSignOut={() => supabase.auth.signOut()} />
        <div style={{ textAlign: 'center', padding: 100 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎧</div>
          <div style={{ fontSize: 16, color: 'var(--text-sec)' }}>DJ not found</div>
          <Link href="/djs" style={{ fontSize: 13, color: 'var(--accent)', marginTop: 12, display: 'block' }}>
            ← Back to DJ Directory
          </Link>
        </div>
      </div>
    );
  }

  const initials = (dj.dj_name ?? 'DJ').slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar
        session={session}
        onUpload={() => !session && setShowAuth(true)}
        onAuth={() => setShowAuth(true)}
        onSignOut={() => supabase.auth.signOut()}
      />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Back link */}
        <Link href="/djs" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ← DJ Directory
        </Link>

        {/* Profile header */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            {dj.avatar_url ? (
              <img src={dj.avatar_url} alt={dj.dj_name ?? ''} style={{ width: 88, height: 88, borderRadius: 44, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 88, height: 88, borderRadius: 44, flexShrink: 0,
                background: 'rgba(124,92,252,0.2)', border: '2px solid rgba(124,92,252,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: 'var(--accent)',
              }}>
                {initials}
              </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  {dj.dj_name ?? 'Unknown DJ'}
                </h1>
                {dj.is_pro && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#F0C040',
                    background: 'rgba(240,192,64,0.15)', border: '1px solid rgba(240,192,64,0.3)',
                    borderRadius: 5, padding: '3px 8px', letterSpacing: '0.06em',
                  }}>PRO</span>
                )}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                {dj.location && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {dj.location}</span>
                )}
                {dj.genre && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🎵 {dj.genre}</span>
                )}
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {mixes.length} mix{mixes.length !== 1 ? 'es' : ''} · {tracks.length} track{tracks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Bio */}
              {dj.bio && (
                <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>
                  {dj.bio}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            {dj.soundcloud_url && (
              <a href={dj.soundcloud_url} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'rgba(255,85,0,0.12)', border: '1px solid rgba(255,85,0,0.3)',
                color: '#FF5500', textDecoration: 'none',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.002.056-.008.109-.008.166 0 2.507 2.04 4.541 4.555 4.541 2.516 0 4.555-2.034 4.555-4.541 0-.057-.006-.11-.008-.166-.092.013-.185.022-.28.022-.753 0-1.433-.26-1.966-.685-.533.425-1.213.685-1.966.685-.753 0-1.432-.26-1.965-.685a2.888 2.888 0 0 1-1.967.685c-.095 0-.188-.009-.28-.022zm16.05-7.738C16.048 3.608 14.699 3 13.207 3c-2.85 0-5.163 2.307-5.17 5.15-.002.038-.003.076-.003.114 0 .057.005.113.007.17.185-.022.375-.034.568-.034 1.354 0 2.588.509 3.52 1.34a5.143 5.143 0 0 1 3.52-1.34c.193 0 .382.012.568.034.003-.057.007-.113.007-.17 0-.038-.001-.076-.003-.114a5.122 5.122 0 0 0-.996-3.053z"/></svg>
                SoundCloud
              </a>
            )}
            {dj.booking_email && (
              <a href={`mailto:${dj.booking_email}?subject=Booking enquiry via Cuerate`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.3)',
                color: 'var(--accent)', textDecoration: 'none',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>
                </svg>
                Book this DJ
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {(['mixes', 'tracks'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color 0.15s',
              textTransform: 'capitalize',
            }}>
              {t} ({t === 'mixes' ? mixes.length : tracks.length})
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'mixes' && (
          mixes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              No mixes shared yet
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {mixes.map(mix => (
                <MixCard key={mix.id} mix={mix} session={session} onRefresh={() => load(id)} />
              ))}
            </div>
          )
        )}

        {tab === 'tracks' && (
          tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              No analysed tracks yet
            </div>
          ) : (
            <div>
              {tracks.map(track => <TrackRow key={track.id} track={track} />)}
            </div>
          )
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  );
}
