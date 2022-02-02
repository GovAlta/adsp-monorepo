import { getHeaderPreview, getFooterPreview } from '../events';
const hasProperHtmlWrapper = (content: string): boolean => {
  // remove spacing between html elements and line breaks to make the string in one line
  const strippedContent = content.replace(/>\s+</g, '><').trim();
  return strippedContent.startsWith('<!doctype html><html>') || strippedContent.startsWith('<!DOCTYPE html><html>');
};

export const getTemplateBody = (body: string, serviceName: string) => {
  if (!hasProperHtmlWrapper(body)) {
    body = body.includes('<style') ? `<style scoped>${body}</style>` : body;
    return `<!doctype html><html>${getHeaderPreview()}${body}${getFooterPreview(serviceName)}</html>`;
  }

  return body;
};
