'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase';
import Navbar from '../../../components/Navbar';
import AuthModal from '../../../components/AuthModal';

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#F5A623' : 'var(--border)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

const RATING_FIELDS = ['pay', 'gear', 'booth', 'vibe'] as const;
const RATING_LABELS: Record<string, string> = { pay: '💰 Pay', gear: '🎛 Gear', booth: '🎧 Booth', vibe: '✨ Vibe' };

export default function VenueProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    if (id) load(id);
  }, [id]);

  async function load(venueId: string) {
    const [venueRes, reviewsRes, gigsRes] = await Promise.all([
      supabase.from('venues').select('*').eq('id', venueId).single(),
      supabase.from('venue_reviews').select('*, profiles(dj_name, avatar_url)').eq('venue_id', venueId).order('created_at', { ascending: false }),
      supabase.from('booking_requests').select('*').eq('venue_id', venueId).eq('status', 'open').order('date', { ascending: true }).limit(5),
    ]);
    if (!venueRes.data) { setNotFound(true); setLoading(false); return; }
    setVenue(venueRes.data);
    setReviews(reviewsRes.data ?? []);
    setGigs(gigsRes.data ?? []);
    setLoading(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar session={session} onUpload={() => {}} onAuth={() => setShowAuth(true)} onSignOut={() => supabase.auth.signOut()} />
      <div style={{ textAlign: 'center', padding: 100, color: 'var(--text-muted)' }}>Loading…</div>
    </div>
  );

  if (notFound || !venue) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar session={session} onUpload={() => {}} onAuth={() => setShowAuth(true)} onSignOut={() => supabase.auth.signOut()} />
      <div style={{ textAlign: 'center', padding: 100 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
        <div style={{ fontSize: 16, color: 'var(--text-sec)' }}>Venue not found</div>
        <Link href="/venues" style={{ fontSize: 13, color: 'var(--accent)', marginTop: 12, display: 'block' }}>← Venue Directory</Link>
      </div>
    </div>
  );

  const overallRating = venue.rating_avg ?? null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar session={session} onUpload={() => {}} onAuth={() => setShowAuth(true)} onSignOut={() => supabase.auth.signOut()} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <Link href="/venues" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          ← Venue Directory
        </Link>

        {/* Header */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{venue.name}</h1>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                {venue.city && <span>📍 {venue.city}</span>}
                {venue.capacity && <span>👥 Cap. {venue.capacity.toLocaleString()}</span>}
                {venue.website && <a href={venue.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>🌐 Website</a>}
              </div>
            </div>
            {overallRating && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#F5A623' }}>{overallRating.toFixed(1)}</div>
                <StarRow rating={overallRating} size={16} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
              </div>
            )}
          </div>

          {venue.description && <p style={{ margin: '16px 0 0', fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6 }}>{venue.description}</p>}

          {/* Per-category ratings */}
          {venue.rating_avg && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              {RATING_FIELDS.map(f => {
                const val = venue[`rating_${f}`];
                if (!val) return null;
                return (
                  <div key={f} style={{ background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{RATING_LABELS[f]}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#F5A623' }}>{Number(val).toFixed(1)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {venue.genres && venue.genres.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
              {venue.genres.map((g: string) => <span key={g} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', borderRadius: 6, padding: '3px 10px' }}>{g}</span>)}
            </div>
          )}
        </div>

        {/* Open gigs */}
        {gigs.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Open gigs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {gigs.map((g: any) => (
                <Link key={g.id} href="/gigs" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{g.date}{g.start_time ? ` · ${g.start_time}` : ''}</div>
                    {g.genre && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{g.genre}</div>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                    {g.fee_min || g.fee_max ? `£${((g.fee_min ?? g.fee_max) / 100).toFixed(0)}${g.fee_max && g.fee_max !== g.fee_min ? `–£${(g.fee_max / 100).toFixed(0)}` : ''}` : 'Fee TBC'}
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/gigs" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>View all gigs →</Link>
          </div>
        )}

        {/* Reviews */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>DJ reviews</h2>
            <button onClick={() => session ? setShowReviewForm(!showReviewForm) : setShowAuth(true)} style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {session ? 'Add review' : 'Sign in to review'}
            </button>
          </div>

          {showReviewForm && session && <ReviewForm venueId={id!} session={session} onSubmit={() => { setShowReviewForm(false); load(id!); }} />}

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>No reviews yet. Be the first to rate this venue.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map((r: any) => (
                <div key={r.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                        {(r.profiles?.dj_name ?? 'D')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{r.profiles?.dj_name ?? 'DJ'}</span>
                    </div>
                    {r.overall_rating && <StarRow rating={r.overall_rating} />}
                  </div>
                  {r.review_text && <p style={{ margin: 0, fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.5 }}>{r.review_text}</p>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    {RATING_FIELDS.map(f => r[`rating_${f}`] ? <span key={f} style={{ fontSize: 11, color: 'var(--text-muted)' }}>{RATING_LABELS[f]} {Number(r[`rating_${f}`]).toFixed(1)}</span> : null)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  );
}

function ReviewForm({ venueId, session, onSubmit }: { venueId: string; session: any; onSubmit: () => void }) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function submit() {
    if (Object.keys(ratings).length === 0) return;
    setSaving(true);
    const overall = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length;
    await supabase.from('venue_reviews').upsert({
      venue_id: venueId, reviewer_id: session.user.id,
      overall_rating: overall, review_text: text.trim() || null,
      ...Object.fromEntries(Object.entries(ratings).map(([k, v]) => [`rating_${k}`, v])),
    }, { onConflict: 'venue_id,reviewer_id' });
    setSaving(false);
    onSubmit();
  }

  return (
    <div style={{ background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {RATING_FIELDS.map(f => (
          <div key={f}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{RATING_LABELS[f]}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRatings(r => ({ ...r, [f]: n }))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid', borderColor: (ratings[f] ?? 0) >= n ? '#F5A623' : 'var(--border)', background: (ratings[f] ?? 0) >= n ? 'rgba(245,166,35,0.15)' : 'var(--surface)', cursor: 'pointer', fontSize: 14 }}>
                  ★
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your experience gigging here…" style={{ width: '100%', height: 80, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
      <button onClick={submit} disabled={saving || Object.keys(ratings).length === 0} style={{ marginTop: 10, padding: '9px 20px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving || Object.keys(ratings).length === 0 ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Submit review'}</button>
    </div>
  );
}