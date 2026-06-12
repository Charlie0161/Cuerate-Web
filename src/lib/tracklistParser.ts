/**
 * Cuerate — Tracklist Parser
 * Parses a raw tracklist string into track pairs and upserts them
 * into the track_transitions table.
 *
 * Call this from UploadModal.tsx after a mix with a tracklist is submitted.
 *
 * Usage:
 *   import { parseAndStoreTransitions } from '../lib/tracklistParser';
 *   await parseAndStoreTransitions(supabase, tracklist, genre);
 */

interface ParsedTrack {
  title: string;
  artist: string;
}

/**
 * Parse a raw tracklist string into an array of { title, artist } objects.
 * Handles common formats:
 *   "01. Artist - Track Name"
 *   "Artist - Track Name"
 *   "Track Name by Artist"
 *   "Track Name (Artist)"
 *   Plain track names (no artist)
 */
export function parseTracklist(raw: string): ParsedTrack[] {
  if (!raw?.trim()) return [];

  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2);

  return lines.map(line => {
    // Strip leading numbering: "01.", "1.", "1)", "[1]", "01 -" etc.
    let cleaned = line.replace(/^[\d]+[\.\)\]\s\-]+\s*/, '').trim();

    // Format: "Artist - Track Name" or "Artist – Track Name"
    const dashMatch = cleaned.match(/^(.+?)\s[-–]\s(.+)$/);
    if (dashMatch) {
      return { artist: dashMatch[1].trim(), title: dashMatch[2].trim() };
    }

    // Format: "Track Name by Artist"
    const byMatch = cleaned.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch) {
      return { title: byMatch[1].trim(), artist: byMatch[2].trim() };
    }

    // Format: "Track Name (Artist)" — less common but seen on Mixcloud tracklists
    const parenMatch = cleaned.match(/^(.+?)\s+\(([^)]+)\)$/);
    if (parenMatch) {
      return { title: parenMatch[1].trim(), artist: parenMatch[2].trim() };
    }

    // Fallback — just a title
    return { title: cleaned, artist: '' };
  }).filter(t => t.title.length > 0);
}

/**
 * Given a parsed tracklist, upsert consecutive track pairs into track_transitions.
 * If a pair already exists, increments transition_count.
 */
export async function parseAndStoreTransitions(
  supabase: any,
  rawTracklist: string,
  _genre?: string,
): Promise<void> {
  const tracks = parseTracklist(rawTracklist);
  if (tracks.length < 2) return;

  // Build pairs
  const pairs = [];
  for (let i = 0; i < tracks.length - 1; i++) {
    const from = tracks[i];
    const to   = tracks[i + 1];
    if (!from.title || !to.title) continue;
    pairs.push({
      from_title:  from.title.toLowerCase().trim(),
      from_artist: from.artist.toLowerCase().trim() || null,
      to_title:    to.title.toLowerCase().trim(),
      to_artist:   to.artist.toLowerCase().trim() || null,
    });
  }
  if (!pairs.length) return;

  // For each pair, upsert — increment count if exists
  // Supabase doesn't support increment on conflict directly, so we do it in a loop
  // For production scale, replace with a PostgreSQL function call
  for (const pair of pairs) {
    const { data: existing } = await supabase
      .from('track_transitions')
      .select('id, transition_count')
      .eq('from_title', pair.from_title)
      .eq('to_title', pair.to_title)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('track_transitions')
        .update({ transition_count: existing.transition_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('track_transitions')
        .insert({ ...pair, transition_count: 1 });
    }
  }
}
