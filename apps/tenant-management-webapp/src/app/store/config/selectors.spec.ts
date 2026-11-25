import { RootState } from '@store/index';
import { selectSupportEmail } from './selectors';

describe('selectSupportEmail', () => {
  it('uses the support email from config', () => {
    const state = { config: { supportEmail: 'support@example.gov.ab.ca' } } as RootState;

    expect(selectSupportEmail(state)).toBe('support@example.gov.ab.ca');
  });

  it('falls back to the platform support email when config does not set one', () => {
    const state = { config: {} } as RootState;

    expect(selectSupportEmail(state)).toBe('adsp@gov.ab.ca');
  });
});
