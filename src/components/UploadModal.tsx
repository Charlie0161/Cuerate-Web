'use client';
import { useState } from 'react';
import { createClient, detectPlatform, fetchOEmbed } from '../lib/supabase';

const GENRES = ['House', 'Techno', 'Drum & Bass', 'UK Garage', 'Jungle', 'Trance', 'Hip-Hop', 'Afrobeats', 'Disco', 'Ambient', 'Other'];

interface UploadModalProps {
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ session, onClose, onSuccess }: UploadModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'set' | 'track'>('set');
  const [genre, setGenre] = useState('');
  const [bpmRange, setBpmRange] = useState('');
  const [tracklist, setTracklist] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [embedPreview, setEmbedPreview] = useState('');

  const supabase = createClient();

  async function handleUrlBlur() {
    if (!url.trim()) return;
    const platform = detectPlatform(url);
    if (platform === 'other') return;
    setFetching(true);
    const oembed = await fetchOEmbed(url, platform);
    if (oembed.title && !title) setTitle(oembed.title);
    if (oembed.html) setEmbedPreview(oembed.html);
    setFetching(false);
  }

  async function handleSubmit() {
    if (!url.trim() || !title.trim()) {
      setError('URL and title are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const platform = detectPlatform(url);
      const oembed = await fetchOEmbed(url, platform);
      const { error: insertError } = await supabase.from('mixes').insert({
        user_id: session.user.id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        genre: genre || null,
        bpm_range: bpmRange.trim() || null,
        tracklist: tracklist.trim() || null,
        external_url: url.trim(),
        platform,
        embed_html: oembed.html,
        thumbnail_url: oembed.thumbnail,
      });
      if (insertError) throw insertError;
      onSuccess();
    } catch (e: any) {
      setError(e.message ?? 'Upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        width: '100%', maxWidth: 560,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1,
        }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Share a mix</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'var(--text-sec)', fontSize: 22, cursor: 'pointer',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* URL */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>
              SoundCloud / Mixcloud / YouTube URL *
            </label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://soundcloud.com/..."
              style={{
                width: '100%', background: 'var(--raised)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
                fontSize: 14, outline: 'none',
              }}
            />
            {fetching && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>Fetching mix info...</div>}
          </div>

          {/* Embed preview */}
          {embedPreview && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Preview</label>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}
                dangerouslySetInnerHTML={{ __html: embedPreview }} />
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', display: 'block', marginBottom: 8 }}>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['set', 'track'] as const).map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                  background: type === t ? 'rgba(124,92,252,0.15)' : 'var(--raised)',
                  color: type === t ? 'var(--accent)' : 'var(--text-sec)',
                  fontSize: 14, fontWeight: 600,
                }}>
                  {t === 'set' ? '🎧 DJ Set' : '🎵 Track'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your mix a title"
              style={{
                width: '100%', background: 'var(--raised)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
                fontSize: 14, outline: 'none',
              }}
            />
          </div>

          {/* Genre + BPM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)} style={{
                width: '100%', background: 'var(--raised)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', color: genre ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 14, outline: 'none', cursor: 'pointer',
              }}>
                <option value="">Select genre</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>BPM range</label>
              <input
                value={bpmRange}
                onChange={e => setBpmRange(e.target.value)}
                placeholder="e.g. 125–132"
                style={{
                  width: '100%', background: 'var(--raised)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
                  fontSize: 14, outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell people about this mix..."
              rows={3}
              style={{
                width: '100%', background: 'var(--raised)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
                fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Tracklist */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>
              Tracklist <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={tracklist}
              onChange={e => setTracklist(e.target.value)}
              placeholder={'01. Artist - Track Name\n02. Artist - Track Name\n...'}
              rows={5}
              style={{
                width: '100%', background: 'var(--raised)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
                fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)',
              borderRadius: 8, padding: '10px 14px', color: 'var(--critical)', fontSize: 13,
            }}>{error}</div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            padding: '13px', borderRadius: 12, background: 'var(--accent)',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Sharing...' : 'Share mix'}
          </button>
        </div>
      </div>
    </div>
  );
}
