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

  it('keeps a literal dotted key distinct from a nested path', () => {
    const before = { 'profile.email': 'old@example.com', profile: { email: 'stable@example.com' } };
    const after = { 'profile.email': 'new@example.com', profile: { email: 'stable@example.com' } };

    const entries = diffChangeSet(before, after);
    expect(entries.map((entry) => [entry.path, entry.kind])).toEqual([
      ['["profile.email"]', 'changed'],
      ['profile.email', 'unchanged'],
    ]);
  });

  it('quotes keys containing brackets in the displayed path', () => {
    expect(diffChangeSet({}, { 'a[0]': 1, list: [{ 'x.y': 2 }] }).map((entry) => entry.path)).toEqual([
      '["a[0]"]',
      'list[0]["x.y"]',
    ]);
  });

  it('does not report an empty or null parent as removed when it becomes populated', () => {
    expect(diffChangeSet({ tags: [] }, { tags: ['a'] })).toEqual([{ path: 'tags[0]', kind: 'added', after: 'a' }]);
    expect(diffChangeSet({ address: null }, { address: { city: 'Edmonton' } })).toEqual([
      { path: 'address.city', kind: 'added', after: 'Edmonton' },
    ]);
    expect(diffChangeSet({ tags: ['a'] }, { tags: [] })).toEqual([{ path: 'tags[0]', kind: 'removed', before: 'a' }]);
  });

  it('treats a missing side as all added or all removed', () => {
    expect(diffChangeSet(undefined, { a: 1 })).toEqual([{ path: 'a', kind: 'added', after: 1 }]);
    expect(diffChangeSet({ a: 1 }, undefined)).toEqual([{ path: 'a', kind: 'removed', before: 1 }]);
  });
});
