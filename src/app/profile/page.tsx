'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' } as React.CSSProperties;
const inputStyle = { width: '100%', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties;

const GENRES = ['House', 'Techno', 'Drum & Bass', 'UK Garage', 'Jungle', 'Trance', 'Hip-Hop', 'Afrobeats', 'Disco', 'Ambient', 'Open Format', 'Other'];

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/'); return; }
      setSession(data.session);
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
      if (data) setProfile(data);
      setLoading(false);
    });
  }, [session]);

  function set(field: string, value: any) {
    setProfile((p: any) => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true); setError(''); setSuccess('');
    const updates: any = {
      dj_name: (profile.dj_name ?? '').trim().slice(0, 60) || null,
      bio: (profile.bio ?? '').trim().slice(0, 300) || null,
      genre: profile.genre || null,
      location: (profile.location ?? '').trim().slice(0, 80) || null,
      booking_email: (profile.booking_email ?? '').trim().slice(0, 100) || null,
      soundcloud_url: (profile.soundcloud_url ?? '').trim().slice(0, 200) || null,
      is_public: !!profile.is_public,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess('Profile saved!');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${session.user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
      setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
    }
    setUploadingAvatar(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!session) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar session={session} onUpload={() => {}} onAuth={() => {}} onSignOut={() => { supabase.auth.signOut(); router.push('/'); }} />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 800, color: 'var(--text)' }}>Edit profile</h1>
        <p style={{ margin: '0 0 32px', fontSize: '14px', color: 'var(--text-muted)' }}>Changes sync to the app.</p>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--raised)', overflow: 'hidden', border: '2px solid var(--border)', flexShrink: 0 }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>{(profile?.dj_name ?? session.user.email ?? '?')[0].toUpperCase()}</div>
            }
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{profile?.dj_name || 'Your name'}</div>
            <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar} style={{ padding: '7px 16px', borderRadius: '8px', background: 'var(--raised)', border: '1px solid var(--border)', color: 'var(--text-sec)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              {uploadingAvatar ? 'Uploading…' : 'Change photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </div>
        </div>

        {error && <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--critical)', marginBottom: '16px' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(77,204,143,0.1)', border: '1px solid rgba(77,204,143,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--success)', marginBottom: '16px' }}>✓ {success}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><label style={labelStyle}>DJ / Artist name</label><input style={inputStyle} value={profile?.dj_name ?? ''} onChange={e => set('dj_name', e.target.value)} placeholder="Your name" /></div>
          <div><label style={labelStyle}>Location</label><input style={inputStyle} value={profile?.location ?? ''} onChange={e => set('location', e.target.value)} placeholder="e.g. London, UK" /></div>
          <div>
            <label style={labelStyle}>Genre</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {GENRES.map(g => (
                <button key={g} onClick={() => set('genre', profile?.genre === g ? null : g)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: profile?.genre === g ? 'var(--accent)' : 'var(--border)', background: profile?.genre === g ? 'rgba(124,92,252,0.15)' : 'var(--raised)', color: profile?.genre === g ? 'var(--accent)' : 'var(--text-sec)' }}>{g}</button>
              ))}
            </div>
          </div>
          <div><label style={labelStyle}>Bio</label><textarea style={{ ...inputStyle, height: '90px', resize: 'vertical' }} value={profile?.bio ?? ''} onChange={e => set('bio', e.target.value)} placeholder="Tell people about yourself…" /></div>
          <div><label style={labelStyle}>Booking email</label><input style={inputStyle} value={profile?.booking_email ?? ''} onChange={e => set('booking_email', e.target.value)} placeholder="bookings@you.com" type="email" /></div>
          <div><label style={labelStyle}>SoundCloud URL</label><input style={inputStyle} value={profile?.soundcloud_url ?? ''} onChange={e => set('soundcloud_url', e.target.value)} placeholder="https://soundcloud.com/…" /></div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>Public profile</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Show in DJ directory</div>
            </div>
            <div onClick={() => set('is_public', !profile?.is_public)} style={{ width: '44px', height: '26px', borderRadius: '13px', background: profile?.is_public ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '3px', left: profile?.is_public ? '21px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={{ padding: '13px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1, marginTop: '8px' }}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}
