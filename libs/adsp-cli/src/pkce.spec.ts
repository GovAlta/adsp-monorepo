import { createHash } from 'crypto';
import { generatePkcePair } from './pkce';

describe('generatePkcePair', () => {
  it('generates a base64url code verifier of the expected length', () => {
    const { codeVerifier } = generatePkcePair();

    expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('generates a code challenge that is the S256 hash of the verifier', () => {
    const { codeVerifier, codeChallenge } = generatePkcePair();

    const expectedChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    expect(codeChallenge).toBe(expectedChallenge);
  });

  it('generates a different pair on every call', () => {
    const first = generatePkcePair();
    const second = generatePkcePair();

    expect(first.codeVerifier).not.toBe(second.codeVerifier);
    expect(first.codeChallenge).not.toBe(second.codeChallenge);
  });
});
