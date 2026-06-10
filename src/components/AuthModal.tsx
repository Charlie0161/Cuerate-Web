'use client';
import { useState } from 'react';
import { createClient } from '../lib/supabase';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [djName, setDjName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const supabase = createClient();

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) { setError('Email and password required.'); return; }
    if (mode === 'signup' && password.length < 8) { setError('Password must be 8+ characters.'); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { full_name: djName.trim() || email.split('@')[0] } },
        });
        if (error) throw error;
        setSuccess('Check your email to confirm, then log in.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  const inputStyle = {
    width: '100%', background: '#1C1C26', border: '1px solid #2A2A38',
    borderRadius: 10, padding: '11px 14px', color: '#F0EFF8',
    fontSize: 15, outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#13131A', borderRadius: 16, border: '1px solid #2A2A38',
        width: '100%', maxWidth: 400, padding: 32,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 12px',
            background: 'rgba(124,92,252,0.2)', border: '1px solid rgba(124,92,252,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#F0EFF8' }}>Cuerate</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#0A0A0C', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex: 1, padding: '9px', borderRadius: 8,
              background: mode === m ? '#1C1C26' : 'transparent',
              border: 'none', color: mode === m ? '#7C5CFC' : '#8A89A0',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <input value={djName} onChange={e => setDjName(e.target.value)}
              placeholder="DJ name" style={inputStyle} />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" type="email" style={inputStyle} autoCapitalize="none" />
          <input value={password} onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Password (min 8 chars)' : 'Password'}
            type="password" style={inputStyle} />

          {error && <div style={{ fontSize: 13, color: '#FF4D4D', background: 'rgba(255,77,77,0.1)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(255,77,77,0.3)' }}>{error}</div>}
          {success && <div style={{ fontSize: 13, color: '#4DCC8F', background: 'rgba(77,204,143,0.1)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(77,204,143,0.3)' }}>{success}</div>}

          <button onClick={handleSubmit} disabled={loading} style={{
            padding: 13, borderRadius: 12, background: '#7C5CFC', border: 'none',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
          }}>
            {loading ? '...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#2A2A38' }} />
            <span style={{ fontSize: 13, color: '#52516A' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#2A2A38' }} />
          </div>

          <button onClick={handleGoogle} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: 13, borderRadius: 12,
            background: '#0D1A2E', border: '1px solid rgba(66,133,244,0.4)',
            color: '#4285F4', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#4285F4">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
