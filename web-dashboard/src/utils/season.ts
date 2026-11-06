export type AnimeSeason = 'Winter' | 'Spring' | 'Summer' | 'Fall';

export interface SeasonInfo {
  season: AnimeSeason;
  year: number;
}

/**
 * Calculates anime broadcast season (Winter, Spring, Summer, Fall) from a Date object or timestamp.
 */
export function getSeasonFromDate(dateInput: Date | number | string): SeasonInfo {
  const date = typeof dateInput === 'object' && dateInput instanceof Date
    ? dateInput
    : new Date(dateInput);

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let season: AnimeSeason = 'Winter';
  if (month >= 4 && month <= 6) {
    season = 'Spring';
  } else if (month >= 7 && month <= 9) {
    season = 'Summer';
  } else if (month >= 10 && month <= 12) {
    season = 'Fall';
  }

  return { season, year };
}
