import { diffChangeSet } from './changeDiff';

describe('diffChangeSet', () => {
  it('classifies added, removed, changed and unchanged fields by dotted path', () => {
    const before = { name: 'a', address: { city: 'Edmonton', zip: 'T5J' }, old: 1, tags: ['x', 'y'] };
    const after = { name: 'b', address: { city: 'Edmonton', zip: 'T5K' }, extra: true, tags: ['x'] };

    expect(diffChangeSet(before, after)).toEqual([
      { path: 'address.city', kind: 'unchanged', before: 'Edmonton', after: 'Edmonton' },
      { path: 'address.zip', kind: 'changed', before: 'T5J', after: 'T5K' },
      { path: 'extra', kind: 'added', after: true },
      { path: 'name', kind: 'changed', before: 'a', after: 'b' },
      { path: 'old', kind: 'removed', before: 1 },
      { path: 'tags[0]', kind: 'unchanged', before: 'x', after: 'x' },
      { path: 'tags[1]', kind: 'removed', before: 'y' },
    ]);
  });

  it('treats a missing side as all added or all removed', () => {
    expect(diffChangeSet(undefined, { a: 1 })).toEqual([{ path: 'a', kind: 'added', after: 1 }]);
    expect(diffChangeSet({ a: 1 }, undefined)).toEqual([{ path: 'a', kind: 'removed', before: 1 }]);
  });
});
