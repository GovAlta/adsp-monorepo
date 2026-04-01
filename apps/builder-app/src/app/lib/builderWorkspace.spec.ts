import { applyWorkspaceChange, applyWorkspaceSnapshot, diffWorkspaceFiles, toFileTree } from './builderWorkspace';

describe('builderWorkspace helpers', () => {
  it('applies a workspace snapshot into a file map', () => {
    expect(
      applyWorkspaceSnapshot([
        { path: 'src/App.tsx', content: 'export default 1;' },
        { path: 'src/main.tsx', content: 'boot();' },
      ]),
    ).toEqual({
      'src/App.tsx': 'export default 1;',
      'src/main.tsx': 'boot();',
    });
  });

  it('applies workspace changes with writes and deletes', () => {
    expect(
      applyWorkspaceChange(
        {
          'src/App.tsx': 'before',
          'src/old.ts': 'remove me',
        },
        {
          writes: [{ path: 'src/App.tsx', content: 'after' }],
          deletes: ['src/old.ts'],
        },
      ),
    ).toEqual({
      'src/App.tsx': 'after',
    });
  });

  it('computes a file diff for preview synchronization', () => {
    expect(
      diffWorkspaceFiles(
        {
          'src/App.tsx': 'before',
          'src/remove.ts': 'gone',
        },
        {
          'src/App.tsx': 'after',
          'src/add.ts': 'new',
        },
      ),
    ).toEqual({
      writes: [
        { path: 'src/App.tsx', content: 'after' },
        { path: 'src/add.ts', content: 'new' },
      ],
      deletes: ['src/remove.ts'],
    });
  });

  it('converts a flat workspace map into a hierarchical file tree', () => {
    expect(
      toFileTree({
        'src/App.tsx': 'export default null;',
      }),
    ).toEqual({
      src: {
        directory: {
          'App.tsx': {
            file: {
              contents: 'export default null;',
            },
          },
        },
      },
    });
  });
});
