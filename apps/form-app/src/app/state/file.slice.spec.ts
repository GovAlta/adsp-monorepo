import { deleteFile, fileReducer } from './file.slice';

const metadataFor = (urn: string) => ({ urn, filename: `${urn}.pdf` });

const stateWith = (metadata: Record<string, unknown>) => ({
  ...fileReducer(undefined, { type: 'init' }),
  metadata,
});

const deleted = (urn: string, propertyId?: string) => ({
  type: deleteFile.fulfilled.type,
  payload: { deleted: true },
  meta: { arg: { urn, propertyId, anonymousApply: false }, requestId: 'r', requestStatus: 'fulfilled' },
});

describe('file slice deleteFile', () => {
  it('removes only the deleted file from an indexed property', () => {
    const state = stateWith({ docs: ['a', 'c', 'd'].map(metadataFor) });

    const next = fileReducer(state as never, deleted('c', 'docs.2'));

    expect(next.metadata.docs.map((f) => f.urn)).toEqual(['a', 'd']);
  });

  it('removes the file from all metadata entries when the property is unknown', () => {
    const state = stateWith({ docs: ['a', 'c'].map(metadataFor), other: ['c'].map(metadataFor) });

    const next = fileReducer(state as never, deleted('c'));

    expect(next.metadata.docs.map((f) => f.urn)).toEqual(['a']);
    expect(next.metadata.other).toBeUndefined();
  });
});
