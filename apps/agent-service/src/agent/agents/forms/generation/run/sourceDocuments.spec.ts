import type { DocumentOutline } from '../../../../utils/documentOutline';
import { describeSections, plannerSourceText } from './sourceDocuments';

const outline = (sections: DocumentOutline['sections']): DocumentOutline => ({
  filename: 'REG3018.pdf',
  urn: 'urn:ads:platform:file-service:v1:/files/abc',
  charCount: 100,
  sections,
});

describe('sourceDocuments', () => {
  const untitled = outline([{ sectionId: 'document', title: 'Document', text: 'Trade Name', untitled: true }]);
  const titled = outline([{ sectionId: 'section-1', title: 'Business details', text: 'Trade Name' }]);

  it('lists an untitled section without its made-up title', () => {
    expect(describeSections([untitled])).toBe('- document: (untitled) (10 chars)');
  });

  it('lists a titled section with its title', () => {
    expect(describeSections([titled])).toBe('- section-1: Business details (10 chars)');
  });

  it('gives the planner an untitled section without its made-up title', () => {
    expect(plannerSourceText([untitled])).toContain("### document: (untitled) (from 'REG3018.pdf')");
  });
});
