'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient, DJProfile } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import AuthModal from '../../components/AuthModal';

const GENRES = ['All', 'House', 'Techno', 'Drum & Bass', 'UK Garage', 'Jungle', 'Trance', 'Hip-Hop', 'Afrobeats', 'Disco', 'Ambient'];

// ─── DJ Card ──────────────────────────────────────────────────────────────────

function DJCard({ dj }: { dj: DJProfile }) {
  const [hovered, setHovered] = useState(false);
  const initials = (dj.dj_name ?? 'DJ').slice(0, 2).toUpperCase();

  return (
    <Link href={`/djs/${dj.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'var(--raised)' : 'var(--surface)',
          border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 14,
          padding: 20,
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Avatar + name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {dj.avatar_url ? (
            <img
              src={dj.avatar_url}
              alt={dj.dj_name ?? 'DJ'}
              style={{ width: 52, height: 52, borderRadius: 26, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: 26, flexShrink: 0,
              background: 'rgba(124,92,252,0.2)',
              border: '1.5px solid rgba(124,92,252,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: 'var(--accent)',
            }}>
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dj.dj_name ?? 'Unknown DJ'}
            </div>
            {dj.location && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                📍 {dj.location}
              </div>
            )}
          </div>
          {dj.is_pro && (
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#F0C040',
              background: 'rgba(240,192,64,0.15)', border: '1px solid rgba(240,192,64,0.3)',
              borderRadius: 5, padding: '2px 7px', letterSpacing: '0.06em', flexShrink: 0,
            }}>
              PRO
            </div>
          )}
        </div>

        {/* Genre badge */}
        {dj.genre && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {dj.genre.split(',').slice(0, 3).map(g => (
              <span key={g} style={{
                fontSize: 11, color: 'var(--accent)', fontWeight: 600,
                background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.25)',
                borderRadius: 5, padding: '2px 8px',
              }}>
                {g.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Bio snippet */}
        {dj.bio && (
          <div style={{
            fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {dj.bio}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DJsPage() {
  const [djs, setDjs] = useState<DJProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    fetchDJs();
  }, []);

  async function fetchDJs() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, dj_name, avatar_url, bio, genre, location, soundcloud_url, booking_email, is_pro, account_type')
      .eq('is_public', true)
      .eq('account_type', 'dj')
      .order('dj_name', { ascending: true });
    setDjs(data ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return djs.filter(dj => {
      const matchesSearch = !search ||
        dj.dj_name?.toLowerCase().includes(search.toLowerCase()) ||
        dj.location?.toLowerCase().includes(search.toLowerCase()) ||
        dj.genre?.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = genre === 'All' ||
        dj.genre?.toLowerCase().includes(genre.toLowerCase());
      return matchesSearch && matchesGenre;
    });
  }, [djs, search, genre]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar
        session={session}
        onUpload={() => !session && setShowAuth(true)}
        onAuth={() => setShowAuth(true)}
        onSignOut={() => supabase.auth.signOut()}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            DJ Directory
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            {djs.length} DJs on Cuerate
          </p>
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 16px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, location or genre..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: 'var(--text)',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 0,
              }}>×</button>
            )}
          </div>

          {/* Genre pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GENRES.map(g => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${genre === g ? 'var(--accent)' : 'var(--border)'}`,
                  background: genre === g ? 'rgba(124,92,252,0.15)' : 'var(--surface)',
                  color: genre === g ? 'var(--accent)' : 'var(--text-sec)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
            Loading DJs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎧</div>
            <div style={{ fontSize: 16, color: 'var(--text-sec)' }}>No DJs found</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Try a different search or genre
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(dj => <DJCard key={dj.id} dj={dj} />)}
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  );
}
