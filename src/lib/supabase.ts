import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = 'https://iaqprkjgphbzmgttpohy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcXBya2pncGhiem1ndHRwb2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODMyMzcsImV4cCI6MjA5NjY1OTIzN30.LRmtJ6KVKtZruYlDn0Psn9XzKZE7w5Gcmn1IMxOKeLU';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export type Mix = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: 'set' | 'track';
  genre: string | null;
  bpm_range: string | null;
  tracklist: string | null;
  external_url: string;
  platform: 'soundcloud' | 'mixcloud' | 'youtube' | 'other';
  embed_html: string | null;
  thumbnail_url: string | null;
  play_count: number;
  published: boolean;
  created_at: string;
  dj_name?: string;
  avatar_url?: string | null;
  like_count?: number;
  comment_count?: number;
};

export type Comment = {
  id: string;
  user_id: string;
  mix_id: string;
  content: string;
  created_at: string;
  profiles?: { dj_name: string | null; avatar_url: string | null };
};

export type Profile = {
  id: string;
  dj_name: string | null;
  avatar_url: string | null;
  soundcloud_username: string | null;
  bio: string | null;
};

// Detect platform from URL
export function detectPlatform(url: string): Mix['platform'] {
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (url.includes('mixcloud.com')) return 'mixcloud';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'other';
}

// Fetch oEmbed data from platform
export async function fetchOEmbed(url: string, platform: Mix['platform']): Promise<{
  html: string | null; thumbnail: string | null; title: string | null;
}> {
  try {
    let oembedUrl = '';
    if (platform === 'soundcloud') {
      oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else if (platform === 'mixcloud') {
      oembedUrl = `https://www.mixcloud.com/oembed/?url=${encodeURIComponent(url)}&format=json`;
    } else if (platform === 'youtube') {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else {
      return { html: null, thumbnail: null, title: null };
    }
    const res = await fetch(oembedUrl);
    const data = await res.json();
    return {
      html: data.html ?? null,
      thumbnail: data.thumbnail_url ?? null,
      title: data.title ?? null,
    };
  } catch {
    return { html: null, thumbnail: null, title: null };
  }
}
