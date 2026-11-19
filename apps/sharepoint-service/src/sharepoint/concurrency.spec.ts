import { runLimited } from './concurrency';

const deferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('runLimited', () => {
  it('returns the results in the order of the items, whatever order the tasks finish in', async () => {
    const gates = [deferred(), deferred(), deferred()];

    const running = runLimited([0, 1, 2], 3, async (item) => {
      await gates[item].promise;
      return `result-${item}`;
    });
    gates[2].resolve();
    gates[0].resolve();
    gates[1].resolve();

    expect(await running).toEqual(['result-0', 'result-1', 'result-2']);
  });

  it('never runs more tasks at once than the limit', async () => {
    let active = 0;
    let mostActive = 0;

    await runLimited(
      Array.from({ length: 10 }, (_, i) => i),
      3,
      async () => {
        active++;
        mostActive = Math.max(mostActive, active);
        await new Promise((resolve) => setTimeout(resolve, 1));
        active--;
      },
    );

    expect(mostActive).toBe(3);
  });

  it('passes each item its index', async () => {
    expect(await runLimited(['a', 'b'], 2, async (item, index) => `${item}${index}`)).toEqual(['a0', 'b1']);
  });

  it('still runs the tasks one at a time when the limit is below 1', async () => {
    let active = 0;
    let mostActive = 0;

    const results = await runLimited([1, 2], 0, async (item) => {
      active++;
      mostActive = Math.max(mostActive, active);
      await Promise.resolve();
      active--;
      return item * 2;
    });

    expect(results).toEqual([2, 4]);
    expect(mostActive).toBe(1);
  });

  it('returns an empty list for no items', async () => {
    expect(await runLimited([], 3, async () => 'never')).toEqual([]);
  });
});
