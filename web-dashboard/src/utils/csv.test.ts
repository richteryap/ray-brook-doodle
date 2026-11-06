import { describe, it, expect } from 'vitest';
import { sanitizeCsvField } from './csv';

describe('sanitizeCsvField', () => {
  it('handles null and undefined values safely', () => {
    expect(sanitizeCsvField(null)).toBe('""');
    expect(sanitizeCsvField(undefined)).toBe('""');
  });

  it('escapes regular strings and numbers in double quotes', () => {
    expect(sanitizeCsvField('Frieren')).toBe('"Frieren"');
    expect(sanitizeCsvField(12)).toBe('"12"');
    expect(sanitizeCsvField(0)).toBe('"0"');
  });

  it('escapes embedded double quotes with RFC-4180 double quotes', () => {
    expect(sanitizeCsvField('Attack on "Titan"')).toBe('"Attack on ""Titan"""');
  });

  it('neutralizes CSV formula injection characters by prepending single quote', () => {
    expect(sanitizeCsvField('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
    expect(sanitizeCsvField('+12345')).toBe('"\'+12345"');
    expect(sanitizeCsvField('-500')).toBe('"\'-500"');
    expect(sanitizeCsvField('@import')).toBe('"\'@import"');
    expect(sanitizeCsvField('\tTabbed')).toBe('"\'\tTabbed"');
    expect(sanitizeCsvField('\rReturn')).toBe('"\'\rReturn"');
  });
});
