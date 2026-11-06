import { describe, it, expect } from 'vitest';
import { parseMediaTitle } from './mediaParser';

describe('parseMediaTitle', () => {
  it('parses anime title and episode number correctly', () => {
    const result = parseMediaTitle('Frieren: Beyond Journey\'s End Episode 28');
    expect(result.title).toBe('Frieren: Beyond Journey\'s End');
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
