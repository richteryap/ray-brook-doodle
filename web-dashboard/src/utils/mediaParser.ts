export interface ParsedMedia {
  title: string;
  episode: number;
}

/**
 * Extracts show title and episode number from raw scraped text.
 * Handles patterns such as "Frieren: Beyond Journey's End Episode 28" or fallback to full title.
 */
export function parseMediaTitle(rawTitle: string): ParsedMedia {
  const cleaned = rawTitle
    .replace(/"/g, '')
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
