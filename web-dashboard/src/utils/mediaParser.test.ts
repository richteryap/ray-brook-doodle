import { describe, it, expect } from 'vitest';
import { parseMediaTitle, normalizeTitle, normalizeSeason } from './mediaParser';

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

  it('normalizes 2nd Season and Season 2 as identical internal comparison keys', () => {
    const ordinal = normalizeTitle("Reincarnated as a Sword 2nd Season");
    const standard = normalizeTitle("Reincarnated as a Sword Season 2");
    expect(ordinal).toBe(standard);
    expect(ordinal).toBe("reincarnated as a sword season 2");
  });

  it('normalizes Season II, Season-2, and S2 as identical', () => {
    const standard = normalizeTitle("Reincarnated as a Sword Season 2");
    expect(normalizeTitle("Reincarnated as a Sword Season II")).toBe(standard);
    expect(normalizeTitle("Reincarnated as a Sword Season-2")).toBe(standard);
    expect(normalizeTitle("Reincarnated as a Sword S2")).toBe(standard);
    expect(normalizeTitle("Reincarnated as a Sword Season 02")).toBe(standard);
  });

  it('preserves artistic standalone Roman numerals without the word Season', () => {
    expect(normalizeTitle("Saga of Tanya the Evil II")).toBe("saga of tanya the evil ii");
    expect(normalizeTitle("Mob Psycho 100 II")).toBe("mob psycho 100 ii");
  });

  it('does NOT collapse split-cour Part 1 and Part 2', () => {
    const part1 = normalizeTitle("Spy x Family Part 1");
    const part2 = normalizeTitle("Spy x Family Part 2");
    expect(part1).not.toBe(part2);
  });
});

describe('normalizeSeason', () => {
  it('handles ordinals 1st through 4th season', () => {
    expect(normalizeSeason("1st season")).toBe("season 1");
    expect(normalizeSeason("2nd season")).toBe("season 2");
    expect(normalizeSeason("3rd season")).toBe("season 3");
    expect(normalizeSeason("4th season")).toBe("season 4");
  });
});
