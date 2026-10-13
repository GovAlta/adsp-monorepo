import { extractXfaFields } from './xfaExtractor';

const mockGetDocument = jest.fn();

jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
}));

function makeDoc(overrides: Partial<{
  allXfaHtml: unknown;
  fieldObjects: Record<string, unknown[]> | null;
  numPages: number;
}>): object {
  return {
    allXfaHtml: overrides.allXfaHtml ?? null,
    getFieldObjects: jest.fn().mockResolvedValue(overrides.fieldObjects ?? null),
    numPages: overrides.numPages ?? 1,
    getPage: jest.fn().mockResolvedValue({
      getXfa: jest.fn().mockResolvedValue(null),
      getAnnotations: jest.fn().mockResolvedValue([]),
    }),
    destroy: jest.fn().mockResolvedValue(undefined),
  };
}

describe('xfaExtractor', () => {
  beforeEach(() => {
    mockGetDocument.mockReturnValue({ promise: Promise.resolve(makeDoc({})) });
  });

  describe('extractXfaFields', () => {
    it('returns null when the PDF has no form content', async () => {
      const result = await extractXfaFields(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
      expect(result).toBeNull();
    });

    it('returns field table when getFieldObjects has entries', async () => {
      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(
          makeDoc({
            fieldObjects: {
              'applicantName': [{ type: 'Tx', value: 'Jane', readOnly: false }],
            },
            numPages: 3,
          }),
        ),
      });

      const result = await extractXfaFields(new Uint8Array([0x25, 0x50, 0x44, 0x46]));

      expect(result).not.toBeNull();
      expect(result?.fields).toHaveLength(1);
      expect(result?.htmlDescription).toContain('applicantName');
      expect(result?.pageCount).toBe(3);
    });

    describe('allXfaHtml deduplication', () => {
      it('emits each named sibling section once when pdfjs repeats the same xfaName', async () => {
        // pdfjs sometimes renders both the master-page template and the rendered
        // page as sibling children with the same xfaName under the root div.
        const duplicatedTree = {
          name: 'div',
          children: [
            // First occurrence — master page template
            {
              name: 'div',
              attributes: { class: 'xfaSubform', xfaName: 'MainForm' },
              children: [
                { name: 'span', attributes: { class: 'xfaField', xfaName: 'firstName' }, children: [] },
              ],
            },
            // Second occurrence — same xfaName, would normally duplicate output
            {
              name: 'div',
              attributes: { class: 'xfaSubform', xfaName: 'MainForm' },
              children: [
                { name: 'span', attributes: { class: 'xfaField', xfaName: 'firstName' }, children: [] },
              ],
            },
          ],
        };

        mockGetDocument.mockReturnValue({
          promise: Promise.resolve(makeDoc({ allXfaHtml: duplicatedTree })),
        });

        const result = await extractXfaFields(new Uint8Array([0x25, 0x50, 0x44, 0x46]));

        expect(result).not.toBeNull();
        // 'MainForm' and 'firstName' should each appear exactly once
        const matches = (result?.htmlDescription ?? '').match(/\[Section: MainForm\]/g);
        expect(matches).toHaveLength(1);
      });

      it('keeps all unnamed sibling nodes (multi-page forms)', async () => {
        // Pages with no xfaName should never be deduplicated regardless of how many exist.
        const multiPageTree = {
          name: 'div',
          children: [
            {
              name: 'div',
              attributes: { class: 'xfaSubform', xfaName: 'Page1' },
              children: [
                { name: 'span', attributes: { class: 'xfaField', xfaName: 'fieldA' }, children: [] },
              ],
            },
            {
              name: 'div',
              attributes: { class: 'xfaSubform', xfaName: 'Page2' },
              children: [
                { name: 'span', attributes: { class: 'xfaField', xfaName: 'fieldB' }, children: [] },
              ],
            },
          ],
        };

        mockGetDocument.mockReturnValue({
          promise: Promise.resolve(makeDoc({ allXfaHtml: multiPageTree })),
        });

        const result = await extractXfaFields(new Uint8Array([0x25, 0x50, 0x44, 0x46]));

        expect(result?.htmlDescription).toContain('Page1');
        expect(result?.htmlDescription).toContain('Page2');
      });
    });
  });
});
