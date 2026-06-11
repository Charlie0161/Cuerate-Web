'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  createClient, GearListing, Condition,
  CONDITION_LABELS, CONDITION_COLORS, formatPrice,
} from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import AuthModal from '../../components/AuthModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'All',         value: '' },
  { label: 'Controllers', value: 'controller' },
  { label: 'CDJs',        value: 'cdj' },
  { label: 'Mixers',      value: 'mixer' },
  { label: 'Speakers',    value: 'speaker' },
  { label: 'Subwoofers',  value: 'subwoofer' },
  { label: 'Headphones',  value: 'headphones' },
  { label: 'Laptops',     value: 'laptop' },
  { label: 'Amplifiers',  value: 'amplifier' },
];

const CATEGORY_LABELS: Record<string, string> = {
  controller: 'DJ Controller', mixer: 'Mixer', cdj: 'CDJ / Standalone',
  speaker: 'Speaker', subwoofer: 'Subwoofer', headphones: 'Headphones',
  laptop: 'Laptop', amplifier: 'Amplifier',
};

const CONDITIONS: Condition[] = ['mint', 'excellent', 'good', 'fair', 'spares'];
const CONDITION_DESCRIPTIONS: Record<Condition, string> = {
  mint:      'Like new, unused or barely used',
  excellent: 'Light use, no marks or scratches',
  good:      'Normal use, minor signs of wear',
  fair:      'Heavy use, visible wear but fully working',
  spares:    'For parts or repair only',
};

// ─── Affiliate helpers (mirror of mobile gearDatabase) ───────────────────────

const AFFILIATE_TAGS = { thomann: '', andertons: '', amazon: '' };

function getBuyLinks(brand: string, model: string) {
  const q = encodeURIComponent(`${brand} ${model}`);
  const t = AFFILIATE_TAGS.thomann   ? `&partner=${AFFILIATE_TAGS.thomann}`   : '';
  const a = AFFILIATE_TAGS.andertons ? `&ref=${AFFILIATE_TAGS.andertons}`     : '';
  const z = AFFILIATE_TAGS.amazon    ? `&tag=${AFFILIATE_TAGS.amazon}`        : '';
  return {
    Thomann:   `https://www.thomann.de/gb/search_dir.html?sw=${q}${t}`,
    Andertons: `https://www.andertons.co.uk/search?q=${q}${a}`,
    Amazon:    `https://www.amazon.co.uk/s?k=${q}${z}`,
  };
}

// ─── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({ listing, onClick }: { listing: GearListing; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const condCol = CONDITION_COLORS[listing.condition];
  const photo = listing.photo_urls?.[0];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', height: 160, background: 'var(--raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo ? (
          <img src={photo} alt={listing.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 48, fontWeight: 700, color: 'rgba(124,92,252,0.3)' }}>
            {listing.brand[0]}
          </span>
        )}
        <span style={{
          position: 'absolute', top: 10, left: 10,
          fontSize: 10, fontWeight: 700, color: condCol,
          background: condCol + '22', border: `1px solid ${condCol}55`,
          borderRadius: 5, padding: '2px 7px',
        }}>
          {CONDITION_LABELS[listing.condition]}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
          {listing.brand}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {listing.model}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>
          {formatPrice(listing.price)}
        </div>
        {listing.location && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            📍 {listing.location}
          </div>
        )}
        {/* Seller row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          {listing.seller_avatar ? (
            <img src={listing.seller_avatar} alt="" style={{ width: 20, height: 20, borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 20, height: 20, borderRadius: 10, background: 'rgba(124,92,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--accent)' }}>
              {(listing.seller_name ?? 'D')[0].toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing.seller_name ?? 'DJ'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Listing detail modal ─────────────────────────────────────────────────────

function ListingDetailOverlay({ listing, onClose, isOwner, onMarkSold, onDelete }: {
  listing: GearListing;
  onClose: () => void;
  isOwner: boolean;
  onMarkSold: () => void;
  onDelete: () => void;
}) {
  const condCol = CONDITION_COLORS[listing.condition];
  const photos = listing.photo_urls ?? [];
  const [photoIdx, setPhotoIdx] = useState(0);
  const buyLinks = getBuyLinks(listing.brand, listing.model);

  const timeAgo = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days < 1) return 'today';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  function handleContact() {
    if (listing.contact_method === 'email' && listing.contact_value) {
      window.open(`mailto:${listing.contact_value}?subject=Re: ${listing.brand} ${listing.model} on Cuerate`, '_blank');
    } else if (listing.contact_method === 'whatsapp' && listing.contact_value) {
      const msg = encodeURIComponent(`Hi, I'm interested in your ${listing.brand} ${listing.model} listed on Cuerate for ${formatPrice(listing.price)}`);
      window.open(`https://wa.me/${listing.contact_value.replace(/\D/g, '')}?text=${msg}`, '_blank');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg)', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 680, maxHeight: '92vh', overflow: 'auto',
        border: '1px solid var(--border)',
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
          {isOwner && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={onMarkSold} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>
                Mark sold
              </button>
              <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--critical)', fontWeight: 600 }}>
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Photos */}
        {photos.length > 0 ? (
          <div>
            <img src={photos[photoIdx]} alt="" style={{ width: '100%', height: 280, objectFit: 'cover' }} />
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto' }}>
                {photos.map((url, i) => (
                  <img key={i} src={url} onClick={() => setPhotoIdx(i)}
                    style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: `2px solid ${photoIdx === i ? 'var(--accent)' : 'transparent'}` }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: 200, background: 'var(--raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 64, fontWeight: 700, color: 'rgba(124,92,252,0.2)' }}>{listing.brand[0]}</span>
          </div>
        )}

        <div style={{ padding: '20px 20px 32px' }}>
          {/* Title + price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{listing.brand}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>{listing.model}</div>
              <div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 2 }}>{CATEGORY_LABELS[listing.category] ?? listing.category}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{formatPrice(listing.price)}</div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: condCol, background: condCol + '18', border: `1px solid ${condCol}44`, borderRadius: 6, padding: '3px 10px' }}>
              {CONDITION_LABELS[listing.condition]}
            </span>
            {listing.location && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px' }}>
                📍 {listing.location}
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px' }}>
              {timeAgo(listing.created_at)}
            </span>
          </div>

          {/* Description */}
          {listing.description && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Description</div>
              <div style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6 }}>{listing.description}</div>
            </div>
          )}

          {/* Includes */}
          {listing.includes && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Includes</div>
              <div style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6 }}>{listing.includes}</div>
            </div>
          )}

          {/* Seller */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Seller</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {listing.seller_avatar ? (
                <img src={listing.seller_avatar} alt="" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                  {(listing.seller_name ?? 'D')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{listing.seller_name ?? 'Anonymous DJ'}</div>
                {listing.seller_location && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{listing.seller_location}</div>}
              </div>
            </div>
          </div>

          {/* Contact button */}
          {!isOwner && listing.contact_method !== 'app' && (
            <button onClick={handleContact} style={{
              width: '100%', padding: '14px 20px', borderRadius: 12,
              background: 'var(--accent)', border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12,
            }}>
              {listing.contact_method === 'email' ? '✉️ Email seller' : '💬 WhatsApp seller'}
            </button>
          )}

          {/* Buy new */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Buy brand new
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(buyLinks).map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {name}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.5 }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>{listing.view_count} views</div>
        </div>
      </div>
    </div>
  );
}

// ─── Create listing modal ─────────────────────────────────────────────────────

function CreateListingModal({ session, onClose, onSuccess }: { session: any; onClose: () => void; onSuccess: () => void }) {
  type Step = 'gear' | 'details' | 'contact';
  const [step, setStep] = useState<Step>('gear');

  // Step 1
  const [brand, setBrand]   = useState('');
  const [model, setModel]   = useState('');
  const [category, setCat]  = useState('controller');

  // Step 2
  const [price, setPrice]         = useState('');
  const [condition, setCond]      = useState<Condition>('good');
  const [description, setDesc]    = useState('');
  const [location, setLocation]   = useState('');
  const [includes, setIncludes]   = useState('');

  // Step 3
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('email');
  const [contactValue, setContactValue]   = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const supabase = createClient();

  async function handleSubmit() {
    const priceInt = Math.round(parseFloat(price.replace('£', '').replace(',', '')) * 100);
    if (!priceInt || priceInt <= 0) { setError('Please enter a valid price.'); return; }
    if (!contactValue.trim()) { setError(`Please enter your ${contactMethod === 'email' ? 'email' : 'WhatsApp number'}.`); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.from('gear_listings').insert({
      seller_id: session.user.id,
      brand: brand.trim(), model: model.trim(), category,
      price: priceInt, condition,
      description: description.trim() || null,
      location: location.trim() || null,
      includes: includes.trim() || null,
      contact_method: contactMethod,
      contact_value: contactValue.trim(),
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  }

  const STEPS = [
    { key: 'gear' as Step, label: 'Gear' },
    { key: 'details' as Step, label: 'Details' },
    { key: 'contact' as Step, label: 'Contact' },
  ];
  const stepIdx = STEPS.findIndex(s => s.key === step);

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14,
    background: 'var(--raised)', border: '1px solid var(--border)',
    color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>List your gear</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, padding: 0 }}>×</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)', gap: 4 }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <div style={{ width: 32, height: 1, background: i <= stepIdx ? 'var(--accent)' : 'var(--border)' }} />}
              <div style={{
                width: 24, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: i < stepIdx ? 'var(--accent)' : i === stepIdx ? 'rgba(124,92,252,0.2)' : 'var(--raised)',
                border: `1px solid ${i <= stepIdx ? 'var(--accent)' : 'var(--border)'}`,
                color: i <= stepIdx ? (i < stepIdx ? '#fff' : 'var(--accent)') : 'var(--text-muted)',
              }}>
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === stepIdx ? 'var(--accent)' : 'var(--text-muted)', fontWeight: i === stepIdx ? 600 : 400 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: '20px 20px 32px' }}>
          {/* Step 1: Gear */}
          {step === 'gear' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Brand *</label>
                <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Pioneer" style={fieldStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Model *</label>
                <input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. DDJ-REV7" style={fieldStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Category *</label>
                <select value={category} onChange={e => setCat(e.target.value)} style={{ ...fieldStyle, cursor: 'pointer' }}>
                  {CATEGORIES.filter(c => c.value).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { if (!brand.trim() || !model.trim()) { setError('Brand and model are required.'); return; } setError(''); setStep('details'); }}
                style={{ padding: '12px 20px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}
              >
                Next →
              </button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Selected gear */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--raised)', border: '1px solid rgba(124,92,252,0.3)', borderRadius: 10, padding: '10px 14px' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{brand}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{model}</div>
                </div>
                <button onClick={() => setStep('gear')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)' }}>Change</button>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Asking price (£) *</label>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 450" type="number" min="1" style={fieldStyle} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Condition *</label>
                {CONDITIONS.map(cond => (
                  <div key={cond} onClick={() => setCond(cond)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
                    borderRadius: 10, border: `1px solid ${condition === cond ? 'var(--accent)' : 'var(--border)'}`,
                    background: condition === cond ? 'rgba(124,92,252,0.08)' : 'transparent',
                    cursor: 'pointer', marginBottom: 6,
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${condition === cond ? 'var(--accent)' : 'var(--border)'}`, background: condition === cond ? 'var(--accent)' : 'transparent', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: condition === cond ? 'var(--text)' : 'var(--text-sec)' }}>{CONDITION_LABELS[cond]}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{CONDITION_DESCRIPTIONS[cond]}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Description</label>
                <textarea value={description} onChange={e => setDesc(e.target.value)} placeholder="Describe the item, any faults, history…"
                  style={{ ...fieldStyle, height: 80, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>What's included</label>
                <input value={includes} onChange={e => setIncludes(e.target.value)} placeholder="e.g. Original box, power cable" style={fieldStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London" style={fieldStyle} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('gear')} style={{ padding: '12px 20px', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--text-sec)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => { if (!price.trim()) { setError('Please enter a price.'); return; } setError(''); setStep('contact'); }}
                  style={{ flex: 1, padding: '12px 20px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Next →</button>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How should buyers contact you?</label>
              {(['email', 'whatsapp'] as const).map(method => (
                <div key={method} onClick={() => setContactMethod(method)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${contactMethod === method ? 'var(--accent)' : 'var(--border)'}`,
                  background: contactMethod === method ? 'rgba(124,92,252,0.08)' : 'transparent', cursor: 'pointer',
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${contactMethod === method ? 'var(--accent)' : 'var(--border)'}`, background: contactMethod === method ? 'var(--accent)' : 'transparent', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: contactMethod === method ? 'var(--text)' : 'var(--text-sec)' }}>
                      {method === 'email' ? 'Email' : 'WhatsApp'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {method === 'email' ? 'Buyers can email you directly' : 'Buyers can WhatsApp you directly'}
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  {contactMethod === 'email' ? 'Email address *' : 'WhatsApp number *'}
                </label>
                <input
                  value={contactValue} onChange={e => setContactValue(e.target.value)}
                  placeholder={contactMethod === 'email' ? 'your@email.com' : '+44 7700 000000'}
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  style={fieldStyle}
                />
              </div>

              {error && <div style={{ fontSize: 13, color: 'var(--critical)', background: 'rgba(255,77,77,0.1)', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('details')} style={{ padding: '12px 20px', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--text-sec)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '12px 20px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Publishing…' : '🏷️ Publish listing'}
                </button>
              </div>
            </div>
          )}

          {error && step !== 'contact' && (
            <div style={{ fontSize: 13, color: 'var(--critical)', marginTop: 10 }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [listings, setListings]   = useState<GearListing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [selected, setSelected]   = useState<GearListing | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAuth, setShowAuth]   = useState(false);
  const [session, setSession]     = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('marketplace_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(80);

    if (category) query = query.eq('category', category);
    if (search.trim()) query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);

    const { data } = await query;
    setListings((data ?? []) as GearListing[]);
    setLoading(false);
  }, [category, search]);

  useEffect(() => { fetchListings(); }, [category]);

  useEffect(() => {
    const t = setTimeout(fetchListings, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleMarkSold(listing: GearListing) {
    if (!confirm('Mark this listing as sold?')) return;
    await supabase.from('gear_listings').update({ status: 'sold' }).eq('id', listing.id);
    setSelected(null);
    fetchListings();
  }

  async function handleDelete(listing: GearListing) {
    if (!confirm('Permanently delete this listing?')) return;
    await supabase.from('gear_listings').delete().eq('id', listing.id);
    setSelected(null);
    fetchListings();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar
        session={session}
        onUpload={() => !session ? setShowAuth(true) : setShowCreate(true)}
        onAuth={() => setShowAuth(true)}
        onSignOut={() => supabase.auth.signOut()}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Marketplace</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
              {loading ? '…' : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => session ? setShowCreate(true) : setShowAuth(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: 'var(--accent)', border: 'none',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12l7-7 7 7"/>
            </svg>
            Sell gear
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by brand or model…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => setCategory(cat.value)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: `1px solid ${category === cat.value ? 'var(--accent)' : 'var(--border)'}`,
              background: category === cat.value ? 'rgba(124,92,252,0.15)' : 'var(--surface)',
              color: category === cat.value ? 'var(--accent)' : 'var(--text-sec)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', opacity: 0.4 }}>
                <div style={{ height: 160, background: 'var(--raised)' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 10, background: 'var(--raised)', borderRadius: 4, width: '50%', marginBottom: 8 }} />
                  <div style={{ height: 14, background: 'var(--raised)', borderRadius: 4, width: '80%', marginBottom: 8 }} />
                  <div style={{ height: 20, background: 'var(--raised)', borderRadius: 4, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              {search || category ? 'No listings match' : 'No listings yet'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {search || category ? 'Try a different search or category' : 'Be the first to list your gear'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {listings.map(l => (
              <ListingCard key={l.id} listing={l} onClick={() => setSelected(l)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ListingDetailOverlay
          listing={selected}
          onClose={() => setSelected(null)}
          isOwner={session?.user?.id === selected.seller_id}
          onMarkSold={() => handleMarkSold(selected)}
          onDelete={() => handleDelete(selected)}
        />
      )}

      {showCreate && session && (
        <CreateListingModal
          session={session}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchListings(); }}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  );
}
