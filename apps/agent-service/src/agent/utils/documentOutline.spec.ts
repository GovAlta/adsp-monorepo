import { buildDocumentOutline, formatDocumentOutline } from './documentOutline';

describe('buildDocumentOutline', () => {
  it('uses page-chunk section ids for PDF pages', () => {
    const outline = buildDocumentOutline(
      {
        text: 'page one page two',
        pageCount: 2,
        pages: [
          { num: 1, text: 'About your team' },
          { num: 2, text: 'Familiarity questions' },
        ],
      },
      'survey.pdf',
      'urn:ads:platform:file-service:v1:/files/abc',
    );

    expect(outline.sections[0].sectionId).toBe('page-1');
    expect(outline.sections[1].title).toBe('Page 2');
  });

  it('splits documents on Category: markers even without HTML headings', () => {
    const html = [
      '<p>Survey instructions. Do not include the text “Category:” in the displayed title.</p>',
      '<p>Category: About your team</p><p>What ministry?</p>',
      '<p>Category: Familiarity and adoption</p><p>Which services?</p>',
      '<p>Category: Future Capabilities</p><p>Would you use secrets storage?</p>',
    ].join('');

    const outline = buildDocumentOutline(
      { text: html, format: 'html' },
      'survey.docx',
      'urn:ads:platform:file-service:v1:/files/docx',
    );

    const titles = outline.sections.map((section) => section.title);
    expect(titles).toContain('About your team');
    expect(titles).toContain('Familiarity and adoption');
    expect(titles).toContain('Future Capabilities');
    expect(outline.sections.find((section) => section.title === 'Future Capabilities')?.text).toContain(
      'Would you use secrets storage?',
    );
  });

  it('splits HTML documents on h1-h3 headings', () => {
    const outline = buildDocumentOutline(
      {
        text: '<h1>Team</h1><p>Who are you?</p><h2>Future</h2><p>What next?</p>',
        format: 'html',
      },
      'survey.docx',
      'urn:ads:platform:file-service:v1:/files/docx',
    );

    expect(outline.sections).toHaveLength(2);
    expect(outline.sections[0].title).toBe('Team');
    expect(outline.sections[1].sectionId).toBe('section-2');
  });
});

describe('formatDocumentOutline', () => {
  it('formats large document metadata without tool directives', () => {
    const text = formatDocumentOutline({
      filename: 'survey.pdf',
      urn: 'urn:ads:platform:file-service:v1:/files/abc',
      pageCount: 6,
      charCount: 9000,
      sections: [{ sectionId: 'page-1', title: 'Page 1', text: 'Intro' }],
    });

    expect(text).toContain('Extracted page/section outline follows');
    expect(text).not.toContain('documentExtractTool');
    expect(text).toContain('pageCount: 6');
  });
});
