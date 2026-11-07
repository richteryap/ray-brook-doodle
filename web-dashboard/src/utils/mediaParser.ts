export interface ParsedMedia {
  title: string;
  episode: number;
}

/**
 * Standardizes title strings for consistent matching and searching across quote styles.
 */
export function normalizeTitle(title: string | null | undefined): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[\u2018\u2019`´']/g, "'")
    .replace(/[\u201C\u201D"]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts show title and episode number from raw scraped text.
 * Handles patterns such as "Frieren: Beyond Journey's End Episode 28" or fallback to full title.
 */
export function parseMediaTitle(rawTitle: string): ParsedMedia {
  const cleaned = rawTitle
    .replace(/"/g, '')
    .replace(/[\u2018\u2019`´]/g, "'")
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
