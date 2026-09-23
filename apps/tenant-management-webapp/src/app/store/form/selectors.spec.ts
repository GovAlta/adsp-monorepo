import { RootState } from '@store/index';
import { selectFormAdminAppLink } from './selectors';

const stateWith = (directory: { service: string; url: string }[]) =>
  ({ tenant: { name: 'My Tenant' }, directory: { directory } } as unknown as RootState);

describe('selectFormAdminAppLink', () => {
  it('builds the tenant form admin app link from the directory', () => {
    const state = stateWith([{ service: 'form-admin-app', url: 'https://form-admin.example.com' }]);
    expect(selectFormAdminAppLink(state)).toBe('https://form-admin.example.com/my-tenant');
  });

  it('returns undefined when the form admin app is not in the directory', () => {
    const state = stateWith([{ service: 'form-app', url: 'https://form.example.com' }]);
    expect(selectFormAdminAppLink(state)).toBeUndefined();
  });
});
