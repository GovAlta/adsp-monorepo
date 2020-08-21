import { encodeNext, decodeAfter } from './cursor';

describe('cursor', () => {

  it('can encode', () => {
    const cursor = encodeNext(10, 10, 10);
    expect(cursor).toBeTruthy();
  });

  it('can encode with no next', () => {
    const cursor = encodeNext(5, 10, 10);
    expect(cursor).toBeFalsy();
  });

  it('can decode', () => {
    const cursor = encodeNext(10, 10, 10);
    const skip = decodeAfter(cursor);
    expect(skip).toBe(20);
  });

  it('can decode falsy cursor', () => {
    const skip = decodeAfter(null);
    expect(skip).toBe(0);
  });
});
