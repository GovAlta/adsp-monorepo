import { getTemplateBody } from './html';

describe('Test email template', () => {
  it('Test PlainTest should have wrapper', () => {
    const plainText = ` Your draft form has been created.`;
    const serviceName = '';
    const message = getTemplateBody(plainText, serviceName);
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
    const serviceName = '';
    const message = getTemplateBody(completeHtml, serviceName);
    expect(message).not.toContain('<header>');
    expect(message).not.toContain('<footer>');
  });
  it('Test html snippet should have wrapper', () => {
    const htmlSnippet = `
    <body>
    <p>Your draft {{ event.payload.name }} form has been created. </p></body>`;
    const serviceName = '';
    const message = getTemplateBody(htmlSnippet, serviceName);
    expect(message).toContain('<header>');
    expect(message).toContain('<footer>');
  });
});
