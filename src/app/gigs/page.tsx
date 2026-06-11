'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, BookingRequest, formatFee } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import AuthModal from '../../components/AuthModal';

const GENRES = ['All', 'House', 'Techno', 'Drum & Bass', 'UK Garage', 'Jungle', 'Trance', 'Hip-Hop', 'Afrobeats', 'Disco', 'Ambient', 'Open Format'];

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' } as React.CSSProperties;
const inputStyle = { width: '100%', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties;

function PostGigModal({ session, onClose, onSuccess }: { session: any; onClose: () => void; onSuccess: () => void }) {
  const [venueName, setVenueName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [genre, setGenre] = useState('');
  const [feeMin, setFeeMin] = useState('');
  const [feeMax, setFeeMax] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function handlePost() {
    if (!venueName.trim()) { setError('Venue name is required'); return; }
    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError('Enter a valid date (YYYY-MM-DD)'); return; }
    if (!location.trim()) { setError('Location is required'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.from('booking_requests').insert({
      venue_id: session.user.id,
      venue_name: venueName.trim().slice(0, 100),
      date: date.trim(), start_time: startTime.trim() || null,
      location: location.trim().slice(0, 100), genre: genre || null,
      fee_min: feeMin ? Math.round(parseFloat(feeMin) * 100) : null,
      fee_max: feeMax ? Math.round(parseFloat(feeMax) * 100) : null,
      description: description.trim().slice(0, 500) || null, status: 'open',
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Post a gig</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)', fontSize: '22px' }}>×</button>
        </div>
        {error && <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--critical)', marginBottom: '16px' }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={labelStyle}>Venue / Event name *</label><input style={inputStyle} value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Fabric, London" /></div>
          <div><label style={labelStyle}>Location *</label><input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, UK" /></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Date *</label><input style={inputStyle} value={date} onChange={e => setDate(e.target.value)} placeholder="YYYY-MM-DD" /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Start time</label><input style={inputStyle} value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="22:00" /></div>
          </div>
          <div>
            <label style={labelStyle}>Genre</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {GENRES.filter(g => g !== 'All').map(g => (
                <button key={g} onClick={() => setGenre(genre === g ? '' : g)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: genre === g ? 'var(--accent)' : 'var(--border)', background: genre === g ? 'rgba(124,92,252,0.15)' : 'var(--raised)', color: genre === g ? 'var(--accent)' : 'var(--text-sec)' }}>{g}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Min fee (£)</label><input style={inputStyle} value={feeMin} onChange={e => setFeeMin(e.target.value)} placeholder="0" type="number" /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Max fee (£)</label><input style={inputStyle} value={feeMax} onChange={e => setFeeMax(e.target.value)} placeholder="0" type="number" /></div>
          </div>
          <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, height: '90px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Set length, vibe, what you're looking for…" /></div>
          <button onClick={handlePost} disabled={loading} style={{ padding: '13px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Posting…' : 'Post gig'}</button>
        </div>
      </div>
    </div>
  );
}

function ApplyModal({ gig, session, onClose, onSuccess }: { gig: BookingRequest; session: any; onClose: () => void; onSuccess: () => void }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function handleApply() {
    if (!message.trim()) { setError('Please write a message'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.from('booking_applications').insert({ request_id: gig.id, dj_id: session.user.id, message: message.trim() });
    setLoading(false);
    if (err) { setError(err.code === '23505' ? 'You have already applied for this gig' : err.message); return; }
    onSuccess();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', width: '100%', maxWidth: '560px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Apply for gig</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)', fontSize: '22px' }}>×</button>
        </div>
        <div style={{ background: 'var(--raised)', borderRadius: '10px', padding: '14px', marginBottom: '16px', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '15px' }}>{gig.venue_name}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{gig.date}{gig.location ? ` · ${gig.location}` : ''} · {formatFee(gig.fee_min, gig.fee_max)}</div>
        </div>
        {error && <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--critical)', marginBottom: '14px' }}>{error}</div>}
        <label style={labelStyle}>Your message *</label>
        <textarea style={{ ...inputStyle, height: '120px', resize: 'vertical', marginBottom: '12px' }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Introduce yourself, share your experience, include mix links…" autoFocus />
        <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Your profile (name, genre, SoundCloud) and booking email will be shared with the venue.</p>
        <button onClick={handleApply} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Sending…' : 'Send application'}</button>
      </div>
    </div>
  );
}

function GigCard({ gig, applied, session, isVenue, onApply, onSignIn }: { gig: BookingRequest; applied: boolean; session: any; isVenue: boolean; onApply: (g: BookingRequest) => void; onSignIn: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: hovered ? 'var(--raised)' : 'var(--surface)', border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '14px', padding: '20px', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{gig.venue_name}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>📅 {gig.date}</span>
            {gig.start_time && <span>🕐 {gig.start_time}</span>}
            {gig.location && <span>📍 {gig.location}</span>}
          </div>
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{formatFee(gig.fee_min, gig.fee_max)}</div>
      </div>
      {gig.genre && <span style={{ alignSelf: 'flex-start', fontSize: '11px', fontWeight: 600, color: 'var(--accent)', background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.25)', borderRadius: '6px', padding: '3px 10px' }}>{gig.genre}</span>}
      {gig.description && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-sec)', lineHeight: 1.5 }}>{gig.description}</p>}
      {!isVenue && (
        applied
          ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', background: 'rgba(77,204,143,0.1)', border: '1px solid rgba(77,204,143,0.3)', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>✓ Applied</div>
          : <button onClick={() => session ? onApply(gig) : onSignIn()} style={{ padding: '10px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>{session ? 'Apply' : 'Sign in to apply'}</button>
      )}
    </div>
  );
}

export default function GigsPage() {
  const [gigs, setGigs] = useState<BookingRequest[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [applyTarget, setApplyTarget] = useState<BookingRequest | null>(null);
  const [genreFilter, setGenreFilter] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');
  const supabase = createClient();
  const isVenue = profile?.is_venue || profile?.account_type === 'venue';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);

  useEffect(() => {
    if (session?.user) supabase.from('profiles').select('account_type, is_venue').eq('id', session.user.id).single().then(({ data }) => setProfile(data));
  }, [session]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('booking_requests').select('*').eq('status', 'open').order('date', { ascending: true });
    setGigs(data ?? []);
    if (session?.user && data?.length) {
      const ids = data.map((g: any) => g.id);
      const { data: apps } = await supabase.from('booking_applications').select('request_id').eq('dj_id', session.user.id).in('request_id', ids);
      setAppliedIds(new Set((apps ?? []).map((a: any) => a.request_id)));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const filtered = genreFilter === 'All' ? gigs : gigs.filter(g => g.genre === genreFilter || !g.genre);

  function flash(msg: string) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar session={session} onUpload={() => {}} onAuth={() => setShowAuth(true)} onSignOut={() => supabase.auth.signOut()} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text)' }}>Gig Board</h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{gigs.length} open gig{gigs.length !== 1 ? 's' : ''} · Venues post slots, DJs apply</p>
          </div>
          {isVenue && (
            <button onClick={() => setShowPost(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>+ Post a gig</button>
          )}
        </div>

        {successMsg && <div style={{ background: 'rgba(77,204,143,0.1)', border: '1px solid rgba(77,204,143,0.3)', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: 'var(--success)', marginBottom: '20px' }}>✓ {successMsg}</div>}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setGenreFilter(g)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: genreFilter === g ? 'var(--accent)' : 'var(--border)', background: genreFilter === g ? 'rgba(124,92,252,0.15)' : 'var(--surface)', color: genreFilter === g ? 'var(--accent)' : 'var(--text-sec)' }}>{g}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => <div key={i} style={{ height: '180px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📢</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{genreFilter !== 'All' ? `No ${genreFilter} gigs right now` : 'No open gigs yet'}</div>
            <div style={{ fontSize: '15px', color: 'var(--text-sec)' }}>{genreFilter !== 'All' ? 'Try a different genre.' : 'Venues will post gig slots here.'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filtered.map(gig => <GigCard key={gig.id} gig={gig} applied={appliedIds.has(gig.id)} session={session} isVenue={isVenue} onApply={setApplyTarget} onSignIn={() => setShowAuth(true)} />)}
          </div>
        )}

        {!isVenue && !loading && (
          <div style={{ marginTop: '48px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>Are you a venue?</div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>Post gig slots and receive applications from DJs on Cuerate.</p>
            <button onClick={() => setShowAuth(true)} style={{ padding: '10px 24px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>{session ? 'Update your account type in the app' : 'Sign up as a venue'}</button>
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
      {showPost && session && <PostGigModal session={session} onClose={() => setShowPost(false)} onSuccess={() => { setShowPost(false); flash('Gig posted!'); load(); }} />}
      {applyTarget && session && <ApplyModal gig={applyTarget} session={session} onClose={() => setApplyTarget(null)} onSuccess={() => { setAppliedIds(prev => new Set([...prev, applyTarget!.id])); setApplyTarget(null); flash('Application sent!'); }} />}
    </div>
  );
}
