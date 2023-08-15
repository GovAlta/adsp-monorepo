import { v4 as uuid } from 'uuid/dist/index';
import { LimitToOne } from './limitToOne';

class Test {
  public fn = jest.fn();

  @LimitToOne()
  doStuff(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.fn();
        resolve(`${uuid()}`);
      }, 100);
    });
  }

  @LimitToOne((propertyKey, a) => `${propertyKey}:${a}`)
  doStuffWithInputs(a: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.fn(a);
        resolve(`${uuid()}`);
      }, 100);
    });
  }

  @LimitToOne()
  doStuffWithError(): Promise<void> {
    return new Promise((_resolve, reject) => {
      setTimeout(() => {
        this.fn();
        reject(new Error('oh noes!'));
      }, 100);
    });
  }
}

describe('LimitToOne', () => {
  it('can share execution', async () => {
    const test = new Test();

    const [a, b] = await Promise.all([test.doStuff(), test.doStuff()]);
    expect(a).toBe(b);

    const c = await test.doStuff();
    expect(a).not.toBe(c);

    expect(test.fn).toHaveBeenCalledTimes(2);
  });

  it('can not share across instances', async () => {
    const instanceA = new Test();
    const instanceB = new Test();

    const [a, b] = await Promise.all([instanceA.doStuff(), instanceB.doStuff()]);
    expect(a).not.toBe(b);
  });

  it('can share execution based on key', async () => {
    const test = new Test();

    const [a, b, c] = await Promise.all([
      test.doStuffWithInputs('a'),
      test.doStuffWithInputs('b'),
      test.doStuffWithInputs('a'),
    ]);
    expect(a).toBe(c);
    expect(a).not.toBe(b);

    expect(test.fn).toHaveBeenCalledTimes(2);
  });

  it('can return error', async () => {
    const test = new Test();

    await expect(Promise.all([test.doStuffWithError(), test.doStuffWithError()])).rejects.toThrow();
    await expect(test.doStuffWithError()).rejects.toThrow();

    expect(test.fn).toHaveBeenCalledTimes(2);
  });
});
