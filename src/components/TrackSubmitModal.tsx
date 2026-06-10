'use client';
import { useState } from 'react';
import { createClient, detectPlatform, fetchOEmbed } from '../lib/supabase';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? '';
const WORKER_SECRET = process.env.NEXT_PUBLIC_WORKER_SECRET ?? '';

interface TrackSubmitModalProps {
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface PlaylistTrack {
  title: string;
  artist: string;
  url: string;
  thumbnail: string | null;
  duration_secs: number | null;
  platform: string;
}

const STATUS_MAP = {
  pending:   { label: 'Queued',    color: '#F5A623' },
  analysing: { label: 'Analysing', color: '#4DB8FF' },
  ready:     { label: 'Ready',     color: '#4DCC8F' },
  failed:    { label: 'Failed',    color: '#FF4D4D' },
};

export default function TrackSubmitModal({ session, onClose, onSuccess }: TrackSubmitModalProps) {
  const [tab, setTab] = useState<'track' | 'playlist'>('track');

  // ── Single track state ─────────────────────────────────────────────────────
  const [url, setUrl]         = useState('');
  const [title, setTitle]     = useState('');
  const [artist, setArtist]   = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError]     = useState('');
  const [preview, setPreview] = useState('');
  const [trackDone, setTrackDone] = useState(false);

  // ── Playlist state ─────────────────────────────────────────────────────────
  const [plUrl, setPlUrl]           = useState('');
  const [plLoading, setPlLoading]   = useState(false);
  const [plError, setPlError]       = useState('');
  const [plTracks, setPlTracks]     = useState<PlaylistTrack[]>([]);
  const [plCapped, setPlCapped]     = useState(false);
  const [plTotal, setPlTotal]       = useState(0);
  const [plSubmitting, setPlSubmitting] = useState(false);
  const [plDone, setPlDone]         = useState(false);
  const [plSubmitted, setPlSubmitted] = useState(0);

  const supabase = createClient();

  const inputStyle = {
    width: '100%', background: 'var(--raised)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    fontSize: 13, fontWeight: 600 as const, color: 'var(--text-sec)',
    display: 'block' as const, marginBottom: 6,
  };

  // ── Single track handlers ──────────────────────────────────────────────────

  async function handleUrlBlur() {
    if (!url.trim()) return;
    const platform = detectPlatform(url);
    if (platform === 'other') return;
    setFetching(true);
    const oembed = await fetchOEmbed(url, platform);
    if (oembed.title && !title) {
      const parts = oembed.title.split(/\s[-–]\s/);
      if (parts.length >= 2) {
        setArtist(parts[0].trim());
        setTitle(parts.slice(1).join(' - ').trim());
      } else {
        setTitle(oembed.title);
      }
    }
    if (oembed.html) setPreview(oembed.html);
    setFetching(false);
  }

  async function handleSingleSubmit() {
    if (!url.trim() || !title.trim()) { setError('URL and title are required.'); return; }
    const platform = detectPlatform(url);
    if (platform === 'other') { setError('Please use a SoundCloud, YouTube, or Mixcloud URL.'); return; }
    setLoading(true); setError('');
    try {
      const oembed = await fetchOEmbed(url, platform);
      const { error: insertError } = await supabase.from('track_submissions').insert({
        submitted_by: session.user.id,
        external_url: url.trim(),
        platform,
        title: title.trim(),
        artist: artist.trim() || null,
        thumbnail_url: oembed.thumbnail,
        status: 'pending',
      });
      if (insertError) throw insertError;
      setTrackDone(true);
      onSuccess();
    } catch (e: any) {
      setError(e.message ?? 'Submit failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Playlist handlers ──────────────────────────────────────────────────────

  function isPlaylistUrl(u: string) {
    return (
      (u.includes('soundcloud.com') && (u.includes('/sets/') || u.includes('?in='))) ||
      (u.includes('youtube.com') && u.includes('list=')) ||
      u.includes('youtu.be')
    );
  }

  async function fetchPlaylist() {
    if (!plUrl.trim()) return;
    if (!isPlaylistUrl(plUrl)) {
      setPlError('That doesn\'t look like a playlist URL. SoundCloud: soundcloud.com/artist/sets/name — YouTube: youtube.com/playlist?list=...');
      return;
    }
    setPlLoading(true); setPlError(''); setPlTracks([]);
    try {
      const res = await fetch(`${WORKER_URL}/playlist/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-worker-secret': WORKER_SECRET },
        body: JSON.stringify({ url: plUrl.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      setPlTracks(data.tracks);
      setPlCapped(data.capped);
      setPlTotal(data.total_found);
    } catch (e: any) {
      setPlError(e.message ?? 'Could not fetch playlist. Check the URL and try again.');
    } finally {
      setPlLoading(false);
    }
  }

  async function submitPlaylist() {
    if (!plTracks.length) return;
    setPlSubmitting(true); setPlError('');
    let submitted = 0;
    try {
      // Bulk insert all tracks as pending — worker picks them up automatically
      const rows = plTracks.map(t => ({
        submitted_by: session.user.id,
        external_url: t.url,
        platform: t.platform,
        title: t.title,
        artist: t.artist || null,
        thumbnail_url: t.thumbnail || null,
        status: 'pending',
      }));

      // Insert in batches of 10 to avoid request size limits
      for (let i = 0; i < rows.length; i += 10) {
        const batch = rows.slice(i, i + 10);
        const { error: insertError } = await supabase.from('track_submissions').insert(batch);
        if (insertError) throw insertError;
        submitted += batch.length;
        setPlSubmitted(submitted);
      }
      setPlDone(true);
      onSuccess();
    } catch (e: any) {
      setPlError(e.message ?? 'Submission failed. Try again.');
    } finally {
      setPlSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px 0', 
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Submit tracks</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Auto-detected BPM + key, ready in ~60s per track
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-sec)',
            fontSize: 22, cursor: 'pointer', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, padding: '14px 24px 0',
          borderBottom: '1px solid var(--border)', marginBottom: 0,
        }}>
          {(['track', 'playlist'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: '8px 8px 0 0',
              border: '1px solid', borderBottom: 'none',
              borderColor: tab === t ? 'var(--border)' : 'transparent',
              background: tab === t ? 'var(--raised)' : 'none',
              color: tab === t ? 'var(--text)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              marginBottom: tab === t ? -1 : 0,
            }}>
              {t === 'track' ? '🎵 Single track' : '📋 Playlist'}
            </button>
          ))}
        </div>

        {/* ── Single track tab ── */}
        {tab === 'track' && (
          <div style={{ padding: 24 }}>
            {trackDone ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Track queued!</p>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 20, lineHeight: 1.5 }}>
                  Analysis takes ~60 seconds. It'll appear in the track database and Set Builder once ready.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 8, padding: '8px 16px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F5A623' }} />
                  <span style={{ fontSize: 13, color: '#F5A623', fontWeight: 600 }}>Queued for analysis</span>
                </div>
                <div style={{ marginTop: 20 }}>
                  <button onClick={onClose} style={{ padding: '10px 28px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Done</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['soundcloud.com', 'youtube.com', 'mixcloud.com'].map(p => (
                    <div key={p} style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--raised)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>{p}</div>
                  ))}
                </div>
                <div>
                  <label style={labelStyle}>Track URL *</label>
                  <input value={url} onChange={e => setUrl(e.target.value)} onBlur={handleUrlBlur}
                    placeholder="https://soundcloud.com/artist/track-name" style={inputStyle} />
                  {fetching && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>Fetching track info…</div>}
                </div>
                {preview && (
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}
                    dangerouslySetInnerHTML={{ __html: preview }} />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Track title *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Track name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Artist</label>
                    <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist name" style={inputStyle} />
                  </div>
                </div>
                {error && <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 8, padding: '10px 14px', color: '#FF4D4D', fontSize: 13 }}>{error}</div>}
                <button onClick={handleSingleSubmit} disabled={loading} style={{ padding: 13, borderRadius: 12, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Submitting…' : 'Submit track for analysis'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Playlist tab ── */}
        {tab === 'playlist' && (
          <div style={{ padding: 24 }}>
            {plDone ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  {plSubmitted} tracks queued!
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 20, lineHeight: 1.5 }}>
                  Each track takes ~60 seconds to analyse. They'll appear in the track database as they complete.
                </p>
                <div style={{ background: 'var(--raised)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 3, width: '100%', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>All {plSubmitted} tracks submitted — analysis running in background</div>
                </div>
                <button onClick={onClose} style={{ padding: '10px 28px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Done</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Platform chips */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {['soundcloud.com/sets', 'youtube.com/playlist'].map(p => (
                    <div key={p} style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--raised)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>{p}</div>
                  ))}
                </div>

                {/* Cap info */}
                <div style={{ background: 'rgba(77,184,255,0.08)', border: '1px solid rgba(77,184,255,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.5 }}>
                  ℹ️ Up to <strong>20 tracks</strong> per playlist. Each is auto-analysed for BPM and Camelot key.
                </div>

                {/* URL input */}
                <div>
                  <label style={labelStyle}>Playlist URL *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={plUrl} onChange={e => { setPlUrl(e.target.value); setPlTracks([]); setPlError(''); }}
                      placeholder="https://soundcloud.com/artist/sets/playlist-name"
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={e => e.key === 'Enter' && fetchPlaylist()}
                    />
                    <button onClick={fetchPlaylist} disabled={plLoading || !plUrl.trim()} style={{
                      padding: '10px 16px', borderRadius: 10, background: 'var(--raised)',
                      border: '1px solid var(--border)', color: 'var(--text)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                      opacity: plLoading || !plUrl.trim() ? 0.5 : 1,
                    }}>
                      {plLoading ? 'Loading…' : 'Fetch tracks'}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>
                    SoundCloud: soundcloud.com/artist/sets/name — YouTube: youtube.com/playlist?list=…
                  </div>
                </div>

                {plError && (
                  <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 8, padding: '10px 14px', color: '#FF4D4D', fontSize: 13 }}>{plError}</div>
                )}

                {/* Track preview list */}
                {plTracks.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {plTracks.length} tracks found
                        {plCapped && (
                          <span style={{ fontSize: 11, color: '#F5A623', marginLeft: 8, fontWeight: 400 }}>
                            (capped at 20 — playlist has {plTotal}+)
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      maxHeight: 260, overflowY: 'auto',
                      background: 'var(--raised)', borderRadius: 10,
                      border: '1px solid var(--border)',
                    }}>
                      {plTracks.map((t, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px',
                          borderBottom: i < plTracks.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          {t.thumbnail && (
                            <img src={t.thumbnail} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          {!t.thumbnail && (
                            <div style={{ width: 36, height: 36, borderRadius: 4, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>♪</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                            {t.artist && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.artist}</div>}
                          </div>
                          <div style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                            background: t.platform === 'soundcloud' ? 'rgba(255,85,0,0.15)' : 'rgba(255,0,0,0.12)',
                            color: t.platform === 'soundcloud' ? '#FF5500' : '#FF4444',
                            flexShrink: 0,
                          }}>
                            {t.platform === 'soundcloud' ? 'SC' : 'YT'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar during submission */}
                    {plSubmitting && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                          <span>Submitting…</span>
                          <span>{plSubmitted}/{plTracks.length}</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', background: 'var(--accent)', borderRadius: 2,
                            width: `${(plSubmitted / plTracks.length) * 100}%`,
                            transition: 'width 0.3s',
                          }} />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={submitPlaylist}
                      disabled={plSubmitting}
                      style={{
                        width: '100%', marginTop: 12, padding: 13, borderRadius: 12,
                        background: 'var(--accent)', border: 'none', color: '#fff',
                        fontSize: 15, fontWeight: 700, cursor: plSubmitting ? 'default' : 'pointer',
                        opacity: plSubmitting ? 0.6 : 1,
                      }}
                    >
                      {plSubmitting
                        ? `Submitting ${plSubmitted}/${plTracks.length}…`
                        : `Submit all ${plTracks.length} tracks for analysis`
                      }
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
