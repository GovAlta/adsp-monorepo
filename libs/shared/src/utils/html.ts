import { getHeaderPreview, getFooterPreview } from '../events';
const hasProperHtmlWrapper = (content: string): boolean => {
  return content.trim().startsWith('<!doctype html>\r\n<html>') || content.trim().startsWith('<!DOCTYPE html>\r\n<html>')
};

export const getTemplateBody = (body: string, serviceName: string) => {
  if (!hasProperHtmlWrapper(body)) {
    return `<!doctype html><html>${getHeaderPreview()}${body}${getFooterPreview(serviceName)}</html>`;
  }
  return body;
};
