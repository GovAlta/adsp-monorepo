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

  it('marks page sections as untitled, since their titles are only page numbers', () => {
    const outline = buildDocumentOutline(
      { text: 'page one', pageCount: 1, pages: [{ num: 1, text: 'About your team' }] },
      'survey.pdf',
      'urn:ads:platform:file-service:v1:/files/abc',
    );

    expect(outline.sections[0].untitled).toBe(true);
  });

  it('marks a document without headings, such as an XFA form, as untitled', () => {
    const outline = buildDocumentOutline(
      { text: '[Field: txtTradeName] Trade Name', format: 'html', xfaForm: true },
      'REG3018.pdf',
      'urn:ads:platform:file-service:v1:/files/abc',
    );

    expect(outline.sections[0].untitled).toBe(true);
  });

  it('does not mark sections taken from document headings as untitled', () => {
    const outline = buildDocumentOutline(
      { text: '<h2>Applicant</h2><p>Name</p><h2>Business</h2><p>Trade name</p>', format: 'html' },
      'requirements.docx',
      'urn:ads:platform:file-service:v1:/files/abc',
    );

    expect(outline.sections.map((section) => section.untitled)).toEqual([undefined, undefined]);
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
