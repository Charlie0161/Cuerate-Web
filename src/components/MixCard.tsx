'use client';
import { useState } from 'react';
import { createClient, Mix, Comment } from '../lib/supabase';

const PLATFORM_COLORS: Record<string, string> = {
  soundcloud: '#FF5500',
  mixcloud: '#52AAD8',
  youtube: '#FF0000',
  other: 'var(--text-muted)',
};

const PLATFORM_LABELS: Record<string, string> = {
  soundcloud: 'SoundCloud',
  mixcloud: 'Mixcloud',
  youtube: 'YouTube',
  other: 'External',
};

interface MixCardProps {
  mix: Mix;
  session: any;
  onRefresh: () => void;
}

export default function MixCard({ mix, session, onRefresh }: MixCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(mix.like_count ?? 0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const supabase = createClient();

  async function handleLike() {
    if (!session) return;
    if (liked) {
      await supabase.from('likes').delete().eq('mix_id', mix.id).eq('user_id', session.user.id);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from('likes').insert({ mix_id: mix.id, user_id: session.user.id });
      setLikeCount(c => c + 1);
    }
    setLiked(!liked);
  }

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(dj_name, avatar_url)')
      .eq('mix_id', mix.id)
      .order('created_at', { ascending: true });
    setComments(data ?? []);
    setCommentsLoaded(true);
  }

  async function toggleComments() {
    if (!showComments && !commentsLoaded) await loadComments();
    setShowComments(!showComments);
  }

  async function submitComment() {
    if (!newComment.trim() || !session) return;
    setSubmittingComment(true);
    await supabase.from('comments').insert({
      mix_id: mix.id,
      user_id: session.user.id,
      content: newComment.trim(),
    });
    setNewComment('');
    await loadComments();
    setSubmittingComment(false);
  }

  const platformColor = PLATFORM_COLORS[mix.platform];
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 14,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright, #3D3D54)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>

      {/* Thumbnail / embed */}
      {expanded && mix.embed_html ? (
        <div className="embed-container" style={{ padding: '0 0' }}
          dangerouslySetInnerHTML={{ __html: mix.embed_html }} />
      ) : mix.thumbnail_url ? (
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setExpanded(true)}>
          <img src={mix.thumbnail_url} alt={mix.title}
            style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 26,
              background: 'rgba(124,92,252,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          height: 80, background: 'linear-gradient(135deg, var(--raised), var(--accent-dim, #3D2E8A))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }} onClick={() => setExpanded(true)}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
      )}

      <div style={{ padding: 16 }}>
        {/* Platform + type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: platformColor,
            background: `${platformColor}20`,
            border: `1px solid ${platformColor}40`,
            borderRadius: 4, padding: '2px 8px',
          }}>{PLATFORM_LABELS[mix.platform]}</span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: mix.type === 'set' ? 'var(--accent)' : 'var(--success)',
            background: mix.type === 'set' ? 'rgba(124,92,252,0.1)' : 'rgba(77,204,143,0.1)',
            border: `1px solid ${mix.type === 'set' ? 'rgba(124,92,252,0.3)' : 'rgba(77,204,143,0.3)'}`,
            borderRadius: 4, padding: '2px 8px',
          }}>{mix.type === 'set' ? 'DJ Set' : 'Track'}</span>
          {mix.genre && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{mix.genre}</span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
          {mix.title}
        </h3>

        {/* DJ name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {mix.avatar_url ? (
            <img src={mix.avatar_url} alt={mix.dj_name ?? ''}
              style={{ width: 24, height: 24, borderRadius: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 24, height: 24, borderRadius: 12,
              background: 'rgba(124,92,252,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'var(--accent)',
            }}>
              {(mix.dj_name ?? 'D')[0].toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 13, color: 'var(--text-sec)', fontWeight: 500 }}>
            {mix.dj_name ?? 'Anonymous DJ'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {timeAgo(mix.created_at)}
          </span>
        </div>

        {/* Description */}
        {mix.description && (
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.5 }}>
            {mix.description}
          </p>
        )}

        {/* BPM */}
        {mix.bpm_range && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            🎚 {mix.bpm_range} BPM
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {/* Play on platform */}
          <a href={mix.external_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 7,
            background: 'var(--raised)', border: '1px solid var(--border)',
            color: 'var(--text-sec)', fontSize: 12, fontWeight: 600,
            textDecoration: 'none', marginRight: 4,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Play
          </a>

          {/* Like */}
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 7,
            background: liked ? 'rgba(255,77,77,0.1)' : 'transparent',
            border: `1px solid ${liked ? 'rgba(255,77,77,0.3)' : 'var(--border)'}`,
            color: liked ? 'var(--critical)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, cursor: session ? 'pointer' : 'default',
          }}>
            {liked ? '❤️' : '🤍'} {likeCount}
          </button>

          {/* Comments */}
          <button onClick={toggleComments} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 7,
            background: showComments ? 'rgba(124,92,252,0.1)' : 'transparent',
            border: `1px solid ${showComments ? 'rgba(124,92,252,0.3)' : 'var(--border)'}`,
            color: showComments ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            💬 {mix.comment_count ?? 0}
          </button>

          {/* Embed toggle */}
          {mix.embed_html && (
            <button onClick={() => setExpanded(!expanded)} style={{
              marginLeft: 'auto',
              padding: '6px 12px', borderRadius: 7,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
            }}>
              {expanded ? 'Hide' : 'Embed'}
            </button>
          )}
        </div>

        {/* Comments section */}
        {showComments && (
          <div style={{ marginTop: 14 }}>
            {comments.length === 0 && commentsLoaded ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                No comments yet. Be first!
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{
                  display: 'flex', gap: 10, padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(124,92,252,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                  }}>
                    {(c.profiles?.dj_name ?? 'D')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 3 }}>
                      {c.profiles?.dj_name ?? 'DJ'}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>{c.content}</div>
                  </div>
                </div>
              ))
            )}

            {session && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitComment()}
                  placeholder="Add a comment..."
                  style={{
                    flex: 1, background: 'var(--raised)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button onClick={submitComment} disabled={submittingComment || !newComment.trim()} style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: 'var(--accent)', border: 'none',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: newComment.trim() ? 'pointer' : 'default',
                  opacity: newComment.trim() ? 1 : 0.5,
                }}>
                  Post
                </button>
              </div>
            )}
            {!session && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                Sign in to leave a comment
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
