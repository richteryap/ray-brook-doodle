/**
 * Escapes and sanitizes a field for safe CSV output.
 * Prevents CSV formula injection by prepending a single quote to formula trigger characters (=, +, -, @, \t, \r).
 */
export function sanitizeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}
