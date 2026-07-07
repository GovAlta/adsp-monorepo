import { SubmittedFormPdfTemplate } from './pdf';

describe('SubmittedFormPdfTemplate', () => {
  describe('additionalStyles', () => {
    it('does not set white-space: nowrap on .body', () => {
      // Regression guard: white-space: nowrap on .body caused sections with long
      // field labels (e.g. cadditionalInformation with 230+ chars) to render the
      // entire group off the right edge of the PDF page, making it appear empty.
      expect(SubmittedFormPdfTemplate.additionalStyles).not.toMatch(/\.body\s*\{[^}]*white-space:\s*nowrap/s);
    });

    it('sets min-width: 0 on .flex-1 to prevent flex overflow', () => {
      // flex items default to min-width: auto, which allows them to expand beyond
      // their container when content (long labels) cannot wrap. min-width: 0 constrains them.
      expect(SubmittedFormPdfTemplate.additionalStyles).toMatch(/\.content\s+\.flex-1\s*\{[^}]*min-width:\s*0/s);
    });

    it('sets overflow-wrap: break-word on .flex-1', () => {
      expect(SubmittedFormPdfTemplate.additionalStyles).toMatch(
        /\.content\s+\.flex-1\s*\{[^}]*overflow-wrap:\s*break-word/s,
      );
    });
  });
});
