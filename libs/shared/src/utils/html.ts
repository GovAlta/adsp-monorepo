import { getHeaderPreview, getFooterPreview } from '../events';
const hasProperHtmlWrapper = (content: string): boolean => {
  const hasHtmlOpeningTag = /<html[^>]*>/g.test(content) || /<HTML[^>]*>/g.test(content);
  const hasHtmlClosingTag = /<\/html[^>]*>/g.test(content) || /<\/HTML[^>]*>/g.test(content);
  return hasHtmlOpeningTag && hasHtmlClosingTag;
};

export const getTemplateBody = (body: string) => {
  if (!hasProperHtmlWrapper(body)) {
    body = body.includes('<style') ? `<style scoped>${body}</style>` : body;
    return `<!doctype html><html>${getHeaderPreview()}<div style="padding: 3rem 11rem;background-color:white;">${body}</div>${getFooterPreview()}</html>`;
  }

  return body;
};
