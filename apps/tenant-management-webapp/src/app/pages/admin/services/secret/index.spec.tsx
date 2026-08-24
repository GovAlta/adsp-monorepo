import { Secret } from './index';
import { Secret as SecretComponent } from './secret';

describe('secret barrel', () => {
  it('re-exports the component the admin router mounts', () => {
    expect(Secret).toBe(SecretComponent);
  });
});
