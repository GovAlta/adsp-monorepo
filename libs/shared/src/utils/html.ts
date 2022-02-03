import { getHeaderPreview, getFooterPreview } from '../events';
const hasProperHtmlWrapper = (content: string): boolean => {
  const hasHtmlOpeningTag = /<html[^>]*>/g.test(content) || /<HTML[^>]*>/g.test(content);
  const hasHtmlClosingTag = /<\/html[^>]*>/g.test(content) || /<\/HTML[^>]*>/g.test(content);
  return hasHtmlOpeningTag && hasHtmlClosingTag;
};

export const getTemplateBody = (body: string, serviceName: string) => {
  if (!hasProperHtmlWrapper(body)) {
    body = body.includes('<style') ? `<style scoped>${body}</style>` : body;
    return `<!doctype html><html>${getHeaderPreview()}${body}${getFooterPreview(serviceName)}</html>`;
  }

  return body;
};
