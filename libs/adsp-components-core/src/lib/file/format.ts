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

// Mirrors File service's check by extension, so a file it would reject isn't sent. File service still decides, and it
// can detect a different format from the content than the name suggests.
export function isFileFormatAllowed(filename: string, allowedFileTypes: readonly string[]): boolean {
  if (allowedFileTypes.length === 0) {
    return true;
  }

  const dot = filename.lastIndexOf('.');
  const extension = dot >= 0 ? filename.slice(dot).toLowerCase() : '';
  return !!extension && allowedFileTypes.some((allowed) => allowed.trim().toLowerCase() === extension);
}

// For guidance text, such as ".pdf, .docx or .png".
export function formatAllowedFileTypes(allowedFileTypes: readonly string[]): string {
  if (allowedFileTypes.length <= 1) {
    return allowedFileTypes.join('');
  }

  return `${allowedFileTypes.slice(0, -1).join(', ')} or ${allowedFileTypes[allowedFileTypes.length - 1]}`;
}
