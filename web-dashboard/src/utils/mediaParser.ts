export interface ParsedMedia {
  title: string;
  episode: number;
}

const ROMAN_NUMERALS: Record<string, string> = {
  i: '1', ii: '2', iii: '3', iv: '4', v: '5',
  vi: '6', vii: '7', viii: '8', ix: '9', x: '10',
};

/**
 * Normalizes synonymous season phrasing (e.g. '2nd Season' -> 'season 2', 'Season II' -> 'season 2', 'S2' -> 'season 2')
 * for consistent internal comparison without altering artistic standalone titles (e.g. 'Tanya the Evil II', 'Mob Psycho 100 II').
 */
export function normalizeSeason(str: string): string {
  if (!str) return '';
  return str
    .replace(
      /\bseason\s+(x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/gi,
      (_, r) => `season ${ROMAN_NUMERALS[r.toLowerCase()] || r}`
    )
    .replace(/\b(\d+)(st|nd|rd|th)\s+season\b/gi, 'season $1')
    .replace(/\bseason\s*[-_.]?\s*0*(\d+)\b/gi, 'season $1')
    .replace(/\bs0*(\d+)\b/gi, 'season $1');
}

/**
 * Standardizes title strings for consistent matching and searching across quote styles, diacritics, and season phrasing.
 */
export function normalizeTitle(title: string | null | undefined): string {
  if (!title) return '';
  const stripped = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2018\u2019`´']/g, "'")
    .replace(/[\u201C\u201D"]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizeSeason(stripped).replace(/\s+/g, ' ').trim();
}

/**
 * Extracts show title and episode number from raw scraped text.
 * Handles patterns such as "Frieren: Beyond Journey's End Episode 28" or fallback to full title.
 */
export function parseMediaTitle(rawTitle: string): ParsedMedia {
  const cleaned = rawTitle
    .replace(/"/g, '')
    .replace(/[\u2018\u2019`´']/g, "'")
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let title = cleaned;
  let episode = 0;

  const match = cleaned.match(/(.*)\s+Episode\s+(\d+)/i);
  if (match) {
    title = match[1].trim();
    episode = parseInt(match[2], 10);
  }

  return { title, episode };
}
