import { getTemplateBody } from './getTemplateBody';

describe('Test email template', () => {
  const channel = 'email';
  it('Test PlainTest should have wrapper', () => {
    const plainText = ` Your draft form has been created.`;
    const message = getTemplateBody(plainText, channel);
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
    const message = getTemplateBody(completeHtml, channel);
    expect(message).not.toContain('<header>');
    expect(message).not.toContain('<footer>');
  });
  it('Test html snippet should have wrapper', () => {
    const htmlSnippet = `
    <body>
    <p>Your draft {{ event.payload.name }} form has been created. </p></body>`;
    const message = getTemplateBody(htmlSnippet, channel);
    expect(message).toContain('<header>');
    expect(message).toContain('<footer>');
  });
});
