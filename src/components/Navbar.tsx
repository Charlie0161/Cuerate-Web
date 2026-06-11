'use client';
import Link from 'next/link';
import { useState } from 'react';

interface NavbarProps {
  session: any;
  onUpload: () => void;
  onAuth: () => void;
  onSignOut: () => void;
}

export default function Navbar({ session, onUpload, onAuth, onSignOut }: NavbarProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {/* Geometric C icon */}
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 30 8 A 18 18 0 1 0 30 40" fill="none" stroke="#7C5CFC" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="30" cy="8" r="3.5" fill="#7C5CFC"/>
          <circle cx="30" cy="40" r="3.5" fill="#AFA9EC"/>
        </svg>
        {/* Wordmark */}
        <div style={{ marginLeft: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.18em', color: 'var(--text)', lineHeight: 1 }}>
            CUERATE
          </div>
          <div style={{ fontSize: 7, fontWeight: 300, letterSpacing: '0.22em', color: 'var(--text-sec)', marginTop: 3 }}>
            DJ COMPANION
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Link href="/" style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          color: 'var(--text-sec)', textDecoration: 'none',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-sec)')}
        >
          Mixes
        </Link>
        <Link href="/tracks" style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          color: 'var(--text-sec)', textDecoration: 'none',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-sec)')}
        >
          Tracks
        </Link>
        <Link href="/djs" style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          color: 'var(--text-sec)', textDecoration: 'none',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-sec)')}
        >
          DJs
        </Link>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {session ? (
          <>
            <button onClick={onUpload} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8,
              background: 'var(--accent)', border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12l7-7 7 7"/>
              </svg>
              Share mix
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={{
                width: 34, height: 34, borderRadius: 17,
                background: 'rgba(124,92,252,0.3)',
                border: '1.5px solid var(--accent)',
                color: 'var(--accent)', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {session.user.email?.[0]?.toUpperCase() ?? 'D'}
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 42,
                  background: 'var(--raised)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 8, minWidth: 160, zIndex: 200,
                }}>
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    {session.user.email}
                  </div>
                  <button onClick={() => { onSignOut(); setShowMenu(false); }} style={{
                    width: '100%', padding: '9px 12px', background: 'none', border: 'none',
                    color: 'var(--critical)', fontSize: 14, cursor: 'pointer', textAlign: 'left', borderRadius: 6,
                  }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button onClick={onAuth} style={{
            padding: '7px 20px', borderRadius: 8,
            background: 'var(--accent)', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
