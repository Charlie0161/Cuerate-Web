'use client';
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(124,92,252,0.2)',
          border: '1px solid rgba(124,92,252,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Cuerate</span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: 'var(--accent)',
          background: 'rgba(124,92,252,0.15)',
          border: '1px solid rgba(124,92,252,0.3)',
          borderRadius: 4, padding: '2px 6px', letterSpacing: '0.5px',
        }}>MIXES</span>
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
