import { getTemplateBody } from './getTemplateBody';

jest.mock('./templates/email-wrapper.hbs', () => {
  return { default: '<html><header></header>{{ content }}<footer></footer></html>' };
});

describe('Test email template', () => {
  it('Test PlainTest should have wrapper', () => {
    const plainText = ` Your draft form has been created.`;
    const message = getTemplateBody(plainText);
    expect(message).toContain('<header>');
    expect(message).toContain('<footer>');
  });
  it('Test complete Html should not have wrapper', () => {
    const completeHtml = ` <!DOCTYPE html>
    <html>
    <head>
    </head>
    <body>
    <p>Your draft {{ event.payload.name }} form has been created. </p></body>
    </html>`;
    const message = getTemplateBody(completeHtml);
    expect(message).not.toContain('<header>');
    expect(message).not.toContain('<footer>');
  });
  it('Test html snippet should have wrapper', () => {
    const htmlSnippet = `
    <body>
    <p>Your draft {{ event.payload.name }} form has been created. </p></body>`;
    const message = getTemplateBody(htmlSnippet);
    expect(message).toContain('<header>');
    expect(message).toContain('<footer>');
  });
});
