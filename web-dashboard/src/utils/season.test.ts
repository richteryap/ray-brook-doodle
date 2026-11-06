import { describe, it, expect } from 'vitest';
import { getSeasonFromDate } from './season';

describe('getSeasonFromDate', () => {
  it('correctly maps months to Winter', () => {
    expect(getSeasonFromDate(new Date('2026-01-15'))).toEqual({ season: 'Winter', year: 2026 });
    expect(getSeasonFromDate(new Date('2026-02-28'))).toEqual({ season: 'Winter', year: 2026 });
    expect(getSeasonFromDate(new Date('2026-03-31'))).toEqual({ season: 'Winter', year: 2026 });
  });

  it('correctly maps months to Spring', () => {
    expect(getSeasonFromDate(new Date('2026-04-01'))).toEqual({ season: 'Spring', year: 2026 });
    expect(getSeasonFromDate(new Date('2026-05-15'))).toEqual({ season: 'Spring', year: 2026 });
    expect(getSeasonFromDate(new Date('2026-06-30'))).toEqual({ season: 'Spring', year: 2026 });
  });

  it('correctly maps months to Summer', () => {
    expect(getSeasonFromDate(new Date('2026-07-01'))).toEqual({ season: 'Summer', year: 2026 });
    expect(getSeasonFromDate(new Date('2026-08-15'))).toEqual({ season: 'Summer', year: 2026 });
    expect(getSeasonFromDate(new Date('2026-09-30'))).toEqual({ season: 'Summer', year: 2026 });
  });

  it('correctly maps months to Fall', () => {
    expect(getSeasonFromDate(new Date('2026-10-01'))).toEqual({ season: 'Fall', year: 2026 });
    expect(getSeasonFromDate(new Date('2026-11-06'))).toEqual({ season: 'Fall', year: 2026 });
    expect(getSeasonFromDate(new Date('2026-12-31'))).toEqual({ season: 'Fall', year: 2026 });
  });

  it('supports numeric timestamp input', () => {
    const timestamp = new Date('2025-07-10T00:00:00Z').getTime();
    expect(getSeasonFromDate(timestamp).season).toBe('Summer');
    expect(getSeasonFromDate(timestamp).year).toBe(2025);
  });
});
