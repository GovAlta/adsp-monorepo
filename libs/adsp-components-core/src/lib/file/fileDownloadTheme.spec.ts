import { defaultFileDownloadTheme } from './fileDownloadTheme';
import { AdspThemes } from '../theme/adsp-themes';

describe('defaultFileDownloadTheme', () => {
  it.each(Object.entries(defaultFileDownloadTheme))('aliases an ADSP token for %s', (_token, value) => {
    expect(value).toMatch(/^var\(--adsp-[a-z0-9-]+\)$/);
  });

  it('is the file download section of the standard theme', () => {
    expect(AdspThemes.standard.components.fileDownload).toEqual(defaultFileDownloadTheme);
  });
});
