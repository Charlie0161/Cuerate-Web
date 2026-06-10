'use client';
import { useState } from 'react';
import { createClient, detectPlatform, fetchOEmbed } from '../lib/supabase';

interface TrackSubmitModalProps {
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Queued',     color: '#F5A623' },
  analysing: { label: 'Analysing…', color: '#4DB8FF' },
  ready:     { label: 'Ready',      color: '#4DCC8F' },
  failed:    { label: 'Failed',     color: '#FF4D4D' },
};

export default function TrackSubmitModal({ session, onClose, onSuccess }: TrackSubmitModalProps) {
  const [url, setUrl]           = useState('');
  const [title, setTitle]       = useState('');
  const [artist, setArtist]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError]       = useState('');
  const [preview, setPreview]   = useState('');
  const [done, setDone]         = useState(false);

  const supabase = createClient();

  async function handleUrlBlur() {
    if (!url.trim()) return;
    const platform = detectPlatform(url);
    if (platform === 'other') return;
    setFetching(true);
    const oembed = await fetchOEmbed(url, platform);
    if (oembed.title && !title) {
      // Try to split "Artist - Title" pattern common on SoundCloud/YouTube
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

  async function handleSubmit() {
    if (!url.trim() || !title.trim()) {
      setError('URL and title are required.');
      return;
    }
    const platform = detectPlatform(url);
    if (platform === 'other') {
      setError('Please use a SoundCloud, YouTube, or Mixcloud URL.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const oembed = await fetchOEmbed(url, platform);
      const { error: insertError } = await supabase.from('track_submissions').insert({
        submitted_by:  session.user.id,
        external_url:  url.trim(),
        platform,
        title:         title.trim(),
        artist:        artist.trim() || null,
        thumbnail_url: oembed.thumbnail,
        status:        'pending',
      });
      if (insertError) throw insertError;
      setDone(true);
      onSuccess();
    } catch (e: any) {
      setError(e.message ?? 'Submit failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--raised)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 13, fontWeight: 600 as const, color: 'var(--text-sec)',
    display: 'block' as const, marginBottom: 6,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
        width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Submit a track</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              We'll auto-detect BPM + key so you can add it to your crate
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-sec)',
            fontSize: 22, cursor: 'pointer', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {done ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎵</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Track queued!</p>
            <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 24, lineHeight: 1.5 }}>
              BPM and key detection usually takes 30–60 seconds. The track will appear in your crate search once it's ready.
            </p>
            {/* Status indicator */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)',
              borderRadius: 8, padding: '8px 16px',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F5A623' }} />
              <span style={{ fontSize: 13, color: '#F5A623', fontWeight: 600 }}>Queued for analysis</span>
            </div>
            <div style={{ marginTop: 24 }}>
              <button onClick={onClose} style={{
                padding: '10px 28px', borderRadius: 10, background: 'var(--accent)',
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Done</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Platform chips */}
            <div style={{ display: 'flex', gap: 8 }}>
              {['soundcloud.com', 'youtube.com', 'mixcloud.com'].map(p => (
                <div key={p} style={{
                  padding: '4px 10px', borderRadius: 6,
                  background: 'var(--raised)', border: '1px solid var(--border)',
                  fontSize: 11, color: 'var(--text-muted)',
                }}>{p}</div>
              ))}
            </div>

            {/* URL */}
            <div>
              <label style={labelStyle}>Track URL *</label>
              <input
                value={url} onChange={e => setUrl(e.target.value)} onBlur={handleUrlBlur}
                placeholder="https://soundcloud.com/artist/track-name"
                style={inputStyle}
              />
              {fetching && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>Fetching track info…</div>}
            </div>

            {/* Embed preview */}
            {preview && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}
                dangerouslySetInnerHTML={{ __html: preview }} />
            )}

            {/* Title + Artist */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Track title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Track name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Artist</label>
                <input value={artist} onChange={e => setArtist(e.target.value)}
                  placeholder="Artist name" style={inputStyle} />
              </div>
            </div>

            {/* Info box */}
            <div style={{
              background: 'rgba(77,184,255,0.08)', border: '1px solid rgba(77,184,255,0.2)',
              borderRadius: 10, padding: '12px 14px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16, marginTop: 1 }}>ℹ️</span>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.5 }}>
                BPM and key are detected automatically — usually within 60 seconds.
                Once ready, the track appears in Set Builder search on the Cuerate app.
              </p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)',
                borderRadius: 8, padding: '10px 14px', color: '#FF4D4D', fontSize: 13,
              }}>{error}</div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              padding: 13, borderRadius: 12, background: 'var(--accent)', border: 'none',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Submitting…' : 'Submit track for analysis'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
