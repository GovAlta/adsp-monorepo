const UNITS = ['KB', 'MB', 'GB', 'TB'];

// Decimal units (1 KB = 1000 bytes), matching how browsers and operating systems usually report download sizes.
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '';
  }

  if (bytes < 1000) {
    return `${bytes} B`;
  }

  let value = bytes;
  let unit = -1;
  do {
    value /= 1000;
    unit += 1;
  } while (value >= 1000 && unit < UNITS.length - 1);

  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`;
}
