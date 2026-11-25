import { SharePointEventDefinitions } from './events';

describe('SharePoint events', () => {
  it('defines the secret change and failure events admins can be notified of', () => {
    expect(SharePointEventDefinitions.map(({ name }) => name)).toEqual([
      'credential-set',
      'credential-deleted',
      'push-failed',
      'file-upload-failed',
    ]);
  });
});
