import { defaultFileUploadTheme } from './fileUploadTheme';
import { AdspThemes } from '../theme/adsp-themes';

describe('defaultFileUploadTheme', () => {
  it.each(Object.entries(defaultFileUploadTheme))('aliases an ADSP token for %s', (_token, value) => {
    expect(value).toMatch(/^var\(--adsp-[a-z0-9-]+\)$/);
  });

  it('is the file upload section of the standard theme', () => {
    expect(AdspThemes.standard.components.fileUpload).toEqual(defaultFileUploadTheme);
  });
});
