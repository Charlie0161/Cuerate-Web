'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import AuthModal from '../../components/AuthModal';

const GENRES = ['All', 'House', 'Techno', 'Drum & Bass', 'UK Garage', 'Jungle', 'Trance', 'Hip-Hop', 'Afrobeats', 'Disco', 'Ambient', 'Open Format'];

interface Venue {
  id: string;
  name: string;
  city: string | null;
  description: string | null;
  genres: string[] | null;
  capacity: number | null;
  rating_avg: number | null;
  review_count: number | null;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#F5A623' : 'var(--border)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/venues/${venue.id}`} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: hovered ? 'var(--raised)' : 'var(--surface)', border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{venue.name}</div>
            {venue.city && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>📍 {venue.city}</div>}
          </div>
          {venue.capacity && <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--raised)', borderRadius: 6, padding: '3px 8px', border: '1px solid var(--border)' }}>Cap. {venue.capacity.toLocaleString()}</div>}
        </div>
        {venue.rating_avg && <StarRow rating={venue.rating_avg} />}
        {venue.description && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{venue.description}</p>}
        {venue.genres && venue.genres.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {venue.genres.slice(0, 3).map(g => <span key={g} style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', borderRadius: 5, padding: '2px 8px' }}>{g}</span>)}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{venue.review_count ?? 0} review{venue.review_count !== 1 ? 's' : ''}</div>
      </div>
    </Link>
  );
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [session, setSession] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from('venues').select('id, name, city, description, genres, capacity, rating_avg, review_count').order('rating_avg', { ascending: false, nullsFirst: false }).limit(100);
    setVenues((data ?? []) as Venue[]);
    setLoading(false);
  }

  const filtered = venues.filter(v => {
    const matchSearch = !search.trim() || v.name.toLowerCase().includes(search.toLowerCase()) || v.city?.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === 'All' || v.genres?.includes(genre);
    return matchSearch && matchGenre;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar session={session} onUpload={() => {}} onAuth={() => setShowAuth(true)} onSignOut={() => supabase.auth.signOut()} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Venue Directory</h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-muted)' }}>{venues.length} venues · Crowdsourced ratings from the Cuerate community</p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 200 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search venues or cities…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {GENRES.map(g => <button key={g} onClick={() => setGenre(g)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: genre === g ? 'var(--accent)' : 'var(--border)', background: genre === g ? 'rgba(124,92,252,0.15)' : 'var(--surface)', color: genre === g ? 'var(--accent)' : 'var(--text-sec)' }}>{g}</button>)}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[...Array(8)].map((_, i) => <div key={i} style={{ height: 160, background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No venues found</div>
            <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>Try a different search or add a venue in the app.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(v => <VenueCard key={v.id} venue={v} />)}
          </div>
        )}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  );
}