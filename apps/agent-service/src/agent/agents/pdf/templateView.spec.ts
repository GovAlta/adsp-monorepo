import { describeTemplate, elideTemplate, MIN_ELIDED_LENGTH, restoreElided } from './templateView';

const logo = `data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg'%3E${"%3Cpath d='M0 0h1v1z'/%3E".repeat(20)}%3C/svg%3E`;
const tutorial = `\n-- ${'Template authoring is all about iteratively developing content. '.repeat(5)}\n`;
const cssNote = ` ${'Puppeteer sets the header height from the page margins. '.repeat(5)}`;

const definition = {
  id: 'permit',
  name: 'Permit notice',
  template: `<!--${tutorial}--><h1>{{data.title}}</h1><!-- short note --><img src="${logo}" />`,
  header: `<style>/*${cssNote}*/ p { margin: 0; }</style><img src="${logo}">`,
  footer: `<div style="background: url(${logo})">Page <span class="pageNumber"></span></div>`,
  additionalStyles: '',
  variables: '{"title": "Permit"}',
};

describe('elideTemplate', () => {
  it('replaces long data URIs and comments with numbered placeholders, the same content with the same number', () => {
    // Act
    const { fields, elided } = elideTemplate(definition);

    // Assert
    expect(fields.template).toBe(
      '<!--[[elided-comment-1]]--><h1>{{data.title}}</h1><!-- short note --><img src="[[elided-asset-2]]" />',
    );
    expect(fields.header).toBe(
      '<style>/*[[elided-comment-3]]*/ p { margin: 0; }</style><img src="[[elided-asset-2]]">',
    );
    expect(fields.footer).toBe(
      '<div style="background: url([[elided-asset-2]])">Page <span class="pageNumber"></span></div>',
    );
    expect(fields.variables).toBe(definition.variables);
    expect(elided).toEqual([tutorial, logo, cssNote]);
  });

  it('keeps short data URIs and comments', () => {
    // Arrange
    const short = { template: '<!-- note --><img src="data:image/png;base64,iVBORw0KGgo=" />/* x */' };

    // Act
    const { fields, elided } = elideTemplate(short);

    // Assert
    expect(fields.template).toBe(short.template);
    expect(elided).toEqual([]);
    expect(MIN_ELIDED_LENGTH).toBeGreaterThan('data:image/png;base64,iVBORw0KGgo='.length);
  });

  it('leaves a template that already contains placeholder text as it is', () => {
    // Arrange
    const literal = { template: `[[elided-asset-1]]<!--${tutorial}-->` };

    // Act
    const { fields, elided } = elideTemplate(literal);

    // Assert
    expect(fields.template).toBe(literal.template);
    expect(elided).toEqual([]);
  });
});

describe('restoreElided', () => {
  it('puts the original text back for each placeholder, so an unchanged field round-trips exactly', () => {
    // Arrange
    const { fields, elided } = elideTemplate(definition);

    // Act
    const restored = restoreElided(
      { template: fields.template, header: fields.header, footer: fields.footer.replace('Page', 'Page No.') },
      elided,
    );

    // Assert
    expect(restored.unknown).toEqual([]);
    expect(restored.fields.template).toBe(definition.template);
    expect(restored.fields.header).toBe(definition.header);
    expect(restored.fields.footer).toBe(definition.footer.replace('Page', 'Page No.'));
    expect(restored.fields).not.toHaveProperty('variables');
  });

  it('reports placeholders that stand for nothing and leaves them in place', () => {
    // Act
    const restored = restoreElided({ template: '<img src="[[elided-asset-7]]">' }, [logo]);

    // Assert
    expect(restored.unknown).toEqual(['[[elided-asset-7]]']);
    expect(restored.fields.template).toBe('<img src="[[elided-asset-7]]">');
  });
});

describe('describeTemplate', () => {
  it('shows every field under a heading, with empty fields marked and long content elided', () => {
    // Act
    const view = describeTemplate(definition);

    // Assert
    expect(view).toContain('Current PDF template "Permit notice" (saved):');
    expect(view).toContain('=== additionalStyles ===\n(empty)');
    expect(view).toContain('=== variables ===\n{"title": "Permit"}');
    expect(view).toContain('[[elided-asset-2]]');
    expect(view).not.toContain('%3Csvg');
  });
});
