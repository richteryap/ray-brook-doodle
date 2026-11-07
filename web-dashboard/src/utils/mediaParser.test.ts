import { describe, it, expect } from 'vitest';
import { parseMediaTitle, normalizeTitle } from './mediaParser';

describe('parseMediaTitle', () => {
  it('parses anime title and episode number correctly', () => {
    const result = parseMediaTitle("Frieren: Beyond Journey's End Episode 28");
    expect(result.title).toBe("Frieren: Beyond Journey's End");
    expect(result.episode).toBe(28);
  });

  it('normalizes curly apostrophes to ASCII apostrophes in scraped titles', () => {
    const result = parseMediaTitle('Frieren: Beyond Journey’s End Episode 28');
    expect(result.title).toBe("Frieren: Beyond Journey's End");
    expect(result.episode).toBe(28);
  });

  it('normalizes internal whitespace, newlines, and quotes', () => {
    const result = parseMediaTitle('  "Solo Leveling"  \n   Episode   12   ');
    expect(result.title).toBe('Solo Leveling');
    expect(result.episode).toBe(12);
  });

  it('falls back to full title and episode 0 if no episode pattern is found', () => {
    const result = parseMediaTitle('Spirited Away The Movie');
    expect(result.title).toBe('Spirited Away The Movie');
    expect(result.episode).toBe(0);
  });
});

describe('normalizeTitle', () => {
  it('treats curly apostrophe and ASCII apostrophe as identical', () => {
    const ascii = normalizeTitle("JoJo's Bizarre Adventure");
    const curly = normalizeTitle("JoJo’s Bizarre Adventure");
    expect(ascii).toBe(curly);
  });

  it('normalizes accents, spaces, and case consistently', () => {
    expect(normalizeTitle("  Frieren: Beyond Journey’s End  ")).toBe("frieren: beyond journey's end");
    expect(normalizeTitle("Komi Can`t Communicate")).toBe("komi can't communicate");
  });

  it('normalizes diacritics / accented characters (e.g. Fiancé to fiance)', () => {
    const withAccent = normalizeTitle("Even Though I'm a Super Timid Noble Girl, I Accepted the Bet From My Cunning Fiancé");
    const plainAscii = normalizeTitle("Even Though I'm a Super Timid Noble Girl, I Accepted the Bet From My Cunning Fiance");
    expect(withAccent).toBe(plainAscii);
  });
});
