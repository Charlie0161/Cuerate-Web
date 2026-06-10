'use client';

import { useState, useEffect } from 'react';
import { createClient, Mix } from '../lib/supabase';
import Navbar from '../components/Navbar';
import MixCard from '../components/MixCard';
import UploadModal from '../components/UploadModal';
import AuthModal from '../components/AuthModal';

const GENRES = ['All', 'House', 'Techno', 'Drum & Bass', 'UK Garage', 'Jungle', 'Trance', 'Hip-Hop', 'Afrobeats', 'Disco', 'Ambient'];

export default function HomePage() {
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'set' | 'track'>('all');
  const [genre, setGenre] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
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
          BoothBuddy Community
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.2 }}>
          DJ Mixes & Sets
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-sec)', margin: '0 auto 24px', maxWidth: 480 }}>
          Discover sets from the BoothBuddy community. Share your own from SoundCloud, Mixcloud or YouTube.
        </p>
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎧</div>
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
    </div>
  );
}
