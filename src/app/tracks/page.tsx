'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import AuthModal from '../../components/AuthModal';
import TrackSubmitModal from '../../components/TrackSubmitModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackSubmission {
  id: string;
  title: string;
  artist: string | null;
  bpm: number | null;
  camelot_key: string | null;
  musical_key: string | null;
  energy: number | null;
  platform: 'soundcloud' | 'youtube' | 'mixcloud';
  external_url: string;
  thumbnail_url: string | null;
  status: 'pending' | 'analysing' | 'ready' | 'failed';
  submitted_by: string;
  created_at: string;
  dj_name?: string | null;
}

// ─── Camelot colour map ───────────────────────────────────────────────────────

const KEY_HUE: Record<string, string> = {
  '1':'#7C5CFC','2':'#9B59FC','3':'#B05AF5','4':'#C86EF0','5':'#D97BE8','6':'#E88CE0',
  '7':'#F49CD6','8':'#E8A0C8','9':'#D4A8D0','10':'#C0B0D8','11':'#AAB8E0','12':'#94C0E8',
};
const KEY_HUE_B: Record<string, string> = {
  '1':'#5C9CFC','2':'#5CB8FC','3':'#4CCCE0','4':'#3DDCC0','5':'#40DCA0','6':'#52E080',
  '7':'#6AE060','8':'#8EE040','9':'#B8E040','10':'#DCE040','11':'#ECC840','12':'#F0A040',
};

function keyColor(k: string): string {
  const num = k.replace(/[AB]/, '');
  return k.endsWith('A') ? KEY_HUE[num] ?? '#7C5CFC' : KEY_HUE_B[num] ?? '#4DB8FF';
}

const PLATFORM_COLORS: Record<string, string> = {
  soundcloud: '#FF5500',
  youtube: '#FF0000',
  mixcloud: '#5000FF',
};

const CAMELOT_KEYS = [
  '1A','2A','3A','4A','5A','6A','7A','8A','9A','10A','11A','12A',
  '1B','2B','3B','4B','5B','6B','7B','8B','9B','10B','11B','12B',
];

const BPM_RANGES = [
  { label: 'Any BPM', min: 0, max: 999 },
  { label: '< 100', min: 0, max: 99 },
  { label: '100–119', min: 100, max: 119 },
  { label: '120–129', min: 120, max: 129 },
  { label: '130–139', min: 130, max: 139 },
  { label: '140–159', min: 140, max: 159 },
  { label: '160+', min: 160, max: 999 },
];

// ─── Track card ───────────────────────────────────────────────────────────────

function TrackCard({ track }: { track: TrackSubmission }) {
  const col = track.camelot_key ? keyColor(track.camelot_key) : '#8A89A0';
  const platformCol = PLATFORM_COLORS[track.platform] ?? '#8A89A0';
  const energyPct = track.energy ? Math.round(track.energy * 100) : null;

  return (
    <a
      href={track.external_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color 0.15s, transform 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Thumbnail / placeholder */}
        <div style={{
          height: 120,
          background: track.thumbnail_url
            ? `url(${track.thumbnail_url}) center/cover no-repeat`
            : `linear-gradient(135deg, ${col}22, ${col}08)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {!track.thumbnail_url && (
            <div style={{ fontSize: 36, opacity: 0.3 }}>♪</div>
          )}
          {/* Platform badge */}
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: platformCol + 'EE',
            borderRadius: 6, padding: '3px 8px',
            fontSize: 11, fontWeight: 700, color: '#fff',
            textTransform: 'capitalize',
          }}>
            {track.platform}
          </div>
          {/* Key badge */}
          {track.camelot_key && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: col + 'EE',
              borderRadius: 6, padding: '3px 8px',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              {track.camelot_key}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px' }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginBottom: 3,
          }}>
            {track.title}
          </div>
          {track.artist && (
            <div style={{
              fontSize: 12, color: 'var(--text-sec)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              marginBottom: 10,
            }}>
              {track.artist}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {track.bpm && (
              <div style={{
                background: 'var(--raised)', borderRadius: 5,
                padding: '3px 8px', fontSize: 11, fontWeight: 600,
                color: 'var(--text-sec)',
              }}>
                {track.bpm} BPM
              </div>
            )}
            {track.camelot_key && (
              <div style={{
                background: col + '18', border: `1px solid ${col}44`,
                borderRadius: 5, padding: '3px 8px',
                fontSize: 11, fontWeight: 700, color: col,
              }}>
                {track.camelot_key}
              </div>
            )}
            {energyPct !== null && (
              <div style={{
                background: 'var(--raised)', borderRadius: 5,
                padding: '3px 8px', fontSize: 11, color: 'var(--text-muted)',
              }}>
                E {Math.round(energyPct / 10)}/10
              </div>
            )}
          </div>

          {/* Submitted by */}
          {track.dj_name && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              Added by {track.dj_name}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ height: 120, background: 'var(--raised)' }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ height: 14, background: 'var(--raised)', borderRadius: 4, marginBottom: 8, width: '70%' }} />
        <div style={{ height: 12, background: 'var(--raised)', borderRadius: 4, width: '45%' }} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TracksPage() {
  const [tracks, setTracks]           = useState<TrackSubmission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [session, setSession]         = useState<any>(null);
  const [showAuth, setShowAuth]       = useState(false);
  const [showSubmit, setShowSubmit]   = useState(false);
  const [search, setSearch]           = useState('');
  const [keyFilter, setKeyFilter]     = useState('');
  const [bpmRange, setBpmRange]       = useState(0); // index into BPM_RANGES
  const [keyPickerOpen, setKeyPickerOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    fetchTracks();
  }, []);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    // Join with profiles to get dj_name
    const { data, error } = await supabase
      .from('track_submissions')
      .select(`
        id, title, artist, bpm, camelot_key, musical_key, energy,
        platform, external_url, thumbnail_url, status, submitted_by, created_at,
        profiles:submitted_by ( dj_name )
      `)
      .eq('status', 'ready')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTracks(data.map((r: any) => ({
        ...r,
        dj_name: r.profiles?.dj_name ?? null,
      })));
    }
    setLoading(false);
  }, []);

  function handleSubmitClick() {
    if (!session) { setShowAuth(true); return; }
    setShowSubmit(true);
  }

  // ── Filtering ───────────────────────────────────────────────────────────────
  const range = BPM_RANGES[bpmRange];
  const filtered = tracks.filter(t => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      t.title.toLowerCase().includes(q) ||
      (t.artist ?? '').toLowerCase().includes(q);
    const matchesKey = !keyFilter || t.camelot_key === keyFilter;
    const matchesBpm = bpmRange === 0 || (
      t.bpm !== null && t.bpm >= range.min && t.bpm <= range.max
    );
    return matchesSearch && matchesKey && matchesBpm;
  });

  const inputStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '9px 14px', color: 'var(--text)',
    fontSize: 14, outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar
        session={session}
        onUpload={() => {}}
        onAuth={() => setShowAuth(true)}
        onSignOut={() => supabase.auth.signOut()}
      />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg, #1A0E3A 0%, var(--bg) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '48px 24px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 12 }}>
          Cuerate Track Database
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.2 }}>
          Tracks with BPM & Key
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-sec)', margin: '0 auto 24px', maxWidth: 480, lineHeight: 1.6 }}>
          Every track auto-analysed for BPM and Camelot key. Add any to your Set Builder crate instantly.
        </p>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '10px 16px',
          maxWidth: 480, margin: '0 auto 16px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or artist…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 15 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          )}
        </div>

        {/* Submit button */}
        <button onClick={handleSubmitClick} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 24px', borderRadius: 10,
          background: 'var(--accent)', border: 'none',
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
          </svg>
          Submit a track for analysis
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          {/* BPM range */}
          <select
            value={bpmRange}
            onChange={e => setBpmRange(Number(e.target.value))}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {BPM_RANGES.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>

          {/* Camelot key picker */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setKeyPickerOpen(!keyPickerOpen)}
              style={{
                ...inputStyle,
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', minWidth: 140,
                borderColor: keyFilter ? 'var(--accent)' : 'var(--border)',
                color: keyFilter ? 'var(--accent)' : 'var(--text-sec)',
              }}
            >
              {keyFilter ? (
                <>
                  <span style={{
                    background: keyColor(keyFilter) + '22',
                    border: `1px solid ${keyColor(keyFilter)}55`,
                    borderRadius: 5, padding: '1px 7px',
                    fontSize: 12, fontWeight: 700, color: keyColor(keyFilter),
                  }}>{keyFilter}</span>
                  <span style={{ fontSize: 13 }}>key</span>
                </>
              ) : (
                <span style={{ fontSize: 13 }}>Any key</span>
              )}
              <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {keyPickerOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4,
                background: 'var(--raised)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 12, zIndex: 100, minWidth: 280,
              }}>
                <button
                  onClick={() => { setKeyFilter(''); setKeyPickerOpen(false); }}
                  style={{
                    width: '100%', padding: '7px 10px', background: !keyFilter ? 'rgba(124,92,252,0.15)' : 'none',
                    border: `1px solid ${!keyFilter ? 'var(--accent)' : 'transparent'}`,
                    borderRadius: 7, color: !keyFilter ? 'var(--accent)' : 'var(--text-sec)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 8,
                  }}
                >
                  Any key
                </button>
                {(['A', 'B'] as const).map(letter => (
                  <div key={letter} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      {letter === 'A' ? 'Minor (A)' : 'Major (B)'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {Array.from({ length: 12 }, (_, i) => {
                        const k = `${i + 1}${letter}`;
                        const col = keyColor(k);
                        const selected = keyFilter === k;
                        return (
                          <button key={k}
                            onClick={() => { setKeyFilter(k); setKeyPickerOpen(false); }}
                            style={{
                              padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
                              background: selected ? col + '33' : col + '18',
                              border: `1px solid ${selected ? col : col + '44'}`,
                              color: col, fontSize: 11, fontWeight: 700,
                              borderWidth: selected ? 2 : 1,
                            }}
                          >{k}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clear filters */}
          {(keyFilter || bpmRange !== 0 || search) && (
            <button
              onClick={() => { setKeyFilter(''); setBpmRange(0); setSearch(''); }}
              style={{
                padding: '9px 14px', borderRadius: 10, background: 'none',
                border: '1px solid var(--border)', color: 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          )}

          {/* Track count */}
          <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
            {loading ? '…' : `${filtered.length} track${filtered.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              {tracks.length === 0 ? 'No tracks yet' : 'No tracks match your filters'}
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-sec)', marginBottom: 24 }}>
              {tracks.length === 0
                ? 'Be the first to submit a track for analysis.'
                : 'Try adjusting your search or filters.'}
            </div>
            {tracks.length === 0 && (
              <button onClick={handleSubmitClick} style={{
                padding: '10px 24px', borderRadius: 10,
                background: 'var(--accent)', border: 'none',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
                Submit a track
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {filtered.map(track => <TrackCard key={track.id} track={track} />)}
          </div>
        )}
      </div>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); }} />
      )}
      {showSubmit && session && (
        <TrackSubmitModal
          session={session}
          onClose={() => setShowSubmit(false)}
          onSuccess={() => { setShowSubmit(false); fetchTracks(); }}
        />
      )}
    </div>
  );
}
