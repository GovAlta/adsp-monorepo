import { loadBuilderExamples } from './loadBuilderExamples';

describe('loadBuilderExamples', () => {
  const examples = loadBuilderExamples();

  it('includes the platform request pattern through the token handler', () => {
    expect(examples).toContain('Platform API requests through the token handler');
    expect(examples).toContain('/token-handler/targets/file-service/file/v1/files');
    expect(examples).toContain("import { apiFetch } from '../lib/tokenHandler';");
  });

  it('warns against tokens in the code and raw fetch for platform requests', () => {
    expect(examples).toContain('Access tokens or secrets in application code');
    expect(examples).toContain('Raw fetch for platform requests');
  });

  it('does not tell the app to hold an access token for the form service', () => {
    expect(examples).not.toContain('accessToken: obtained from auth flow');
    expect(examples).toContain('tokenHandler: true');
  });
});
