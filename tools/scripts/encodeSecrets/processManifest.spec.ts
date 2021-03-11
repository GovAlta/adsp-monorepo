import { Base64 } from 'js-base64';
import { processManifest } from './processManifest';

describe('processManifest', () => {
  it('can encode Secret data', () => {
    const result = processManifest({
      kind: 'Secret',
      data: {
        value: 'abc-gfe'
      }
    });

    expect(Base64.decode(result.data.value)).toBe('abc-gfe');
  });

  it('can encode List item Secret data', () => {
    const result = processManifest({
      kind: 'List',
      items: [
        {
          kind: 'Secret',
          data: {
            value: 'abc-gfe'
          }
        }
      ]
    });

    expect(Base64.decode(result.items[0].data.value)).toBe('abc-gfe');
  });

  it('can return null for undefined kind', () => {
    const result = processManifest({
      kind: undefined,
      data: {
        value: 'abc-gfe'
      }
    });

    expect(result).toBeNull();
  });

  it('can return null for unrecognized kind', () => {
    const result = processManifest({
      kind: 'BuildConfig',
      data: {
        value: 'abc-gfe'
      }
    });

    expect(result).toBeNull();
  });

  it('can return null for Secret without data', () => {
    const result = processManifest({
      kind: 'Secret',
      data: undefined
    });

    expect(result).toBeNull();
  });

  it('can return null for Secret without data values', () => {
    const result = processManifest({
      kind: 'Secret',
      data: {
      }
    });

    expect(result).toBeNull();
  });

  it('can return null for List without Secret', () => {
    const result = processManifest({
      kind: 'List',
      items: [
        {
          kind: 'BuildConfig',
          data: {
            value: 'abc-gfe'
          }
        }
      ]
    });

    expect(result).toBeNull();
  });
});
