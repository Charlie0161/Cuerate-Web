'use client';

import { useState, useEffect } from 'react';
import { createClient, Mix } from '../lib/supabase';
import Navbar from '../components/Navbar';
import MixCard from '../components/MixCard';
import UploadModal from '../components/UploadModal';
import AuthModal from '../components/AuthModal';
import TrackSubmitModal from '../components/TrackSubmitModal';

const GENRES = ['All', 'House', 'Techno', 'Drum & Bass', 'UK Garage', 'Jungle', 'Trance', 'Hip-Hop', 'Afrobeats', 'Disco', 'Ambient'];

export default function HomePage() {
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'set' | 'track'>('all');
  const [genre, setGenre] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [showTrackSubmit, setShowTrackSubmit] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    fetchMixes();
  }, [filter, genre]);

  async function fetchMixes() {
    setLoading(true);
    let query = supabase
      .from('mix_feed')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('type', filter);
    if (genre !== 'All') query = query.eq('genre', genre);

    const { data } = await query;
    setMixes(data ?? []);
    setLoading(false);
  }

  function handleTrackSubmitClick() {
    if (!session) { setShowAuth(true); return; }
    setShowTrackSubmit(true);
  }

  function handleUploadClick() {
    if (!session) { setShowAuth(true); return; }
    setShowUpload(true);
  }

  const filtered = searchQuery
    ? mixes.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.dj_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mixes;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar
        session={session}
        onUpload={handleUploadClick}
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
          Cuerate Community
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.2 }}>
          DJ Mixes & Sets
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-sec)', margin: '0 auto 24px', maxWidth: 480 }}>
          Discover sets from the Cuerate community. Share your own from SoundCloud, Mixcloud or YouTube.
        </p>
        {/* App download CTAs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <a href='https://apps.apple.com/app/cuerate/id0000000000' target='_blank' rel='noopener noreferrer' style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'><path d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z'/></svg>
            App Store
          </a>
          <a href='https://play.google.com/store/apps/details?id=com.cuerate.app' target='_blank' rel='noopener noreferrer' style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'><path d='M3.18 23.76c.3.17.64.24.99.2l12.01-12.01L12.77 8.6 3.18 23.76zM20.62 10.1l-2.93-1.66-3.44 3.44 3.44 3.44 2.96-1.67c.84-.48.84-1.67-.03-2.55zM1.19.91C1.07 1.18 1 1.5 1 1.87v20.26c0 .37.07.69.19.96l.05.06 11.35-11.36v-.13L1.24.85l-.05.06zM16.37 16.19 4.35 23.13c-.32.18-.63.23-.92.17l12.01-12.01 2.93 1.66c-.34.48-.87.87-2 1.24z'/></svg>
            Google Play
          </a>
        </div>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', maxWidth: 480, margin: '0 auto' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search DJs, tracks, genres..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 15 }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'set', 'track'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 16px', borderRadius: 20, border: '1px solid',
                borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                background: filter === f ? 'rgba(124,92,252,0.15)' : 'var(--surface)',
                color: filter === f ? 'var(--accent)' : 'var(--text-sec)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize',
              }}>
                {f === 'all' ? 'All' : f === 'set' ? 'DJ Sets' : 'Tracks'}
              </button>
            ))}
          </div>
          <button onClick={handleUploadClick} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 10,
            background: 'var(--accent)', border: 'none',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12l7-7 7 7"/>
            </svg>
            Share a mix
          </button>
          <button onClick={handleTrackSubmitClick} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--accent)',
            color: 'var(--accent)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
            </svg>
            Submit a track
          </button>
        </div>

        {/* Genre pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 8 }}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setGenre(g)} style={{
              flexShrink: 0,
              padding: '5px 14px', borderRadius: 20, border: '1px solid',
              borderColor: genre === g ? 'var(--accent)' : 'var(--border)',
              background: genre === g ? 'rgba(124,92,252,0.15)' : 'transparent',
              color: genre === g ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{g}</button>
          ))}
        </div>

        {/* Mix grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 280, background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>ðŸŽ§</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              {searchQuery ? 'No results found' : 'No mixes yet'}
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-sec)' }}>
              {searchQuery ? 'Try a different search' : 'Be the first to share a mix!'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map(mix => (
              <MixCard
                key={mix.id}
                mix={mix}
                session={session}
                onRefresh={fetchMixes}
              />
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          session={session}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchMixes(); }}
        />
      )}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); fetchMixes(); }} />
      )}
      {showTrackSubmit && session && (
        <TrackSubmitModal
          session={session}
          onClose={() => setShowTrackSubmit(false)}
          onSuccess={() => setShowTrackSubmit(false)}
        />
      )}
    </div>
  );
}
