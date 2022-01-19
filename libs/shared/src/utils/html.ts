import { getHeaderPreview, getFooterPreview } from '../events';
export const hasProperHtmlWrapper = (content: string): boolean => {
  return content.trim().startsWith('<!doctype html>') || content.trim().startsWith('<html>');
};
export const hasHeaderAndFooter = (content: string): boolean => {
  return content.includes('<header>') && content.includes('<footer>');
};

export const insertAt = (content: string, subString: string, position: number) =>
  `${content.slice(0, position)}${subString}${content.slice(position)}`;

export const getTemplateBody = (body: string, serviceName: string) => {
  if (!hasProperHtmlWrapper(body)) {
    return `<!doctype html><html>${getHeaderPreview()}${body}${getFooterPreview(serviceName)}</html>`;
  }
  return body;
};
