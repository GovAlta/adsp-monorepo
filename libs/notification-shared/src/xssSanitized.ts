import { sanitize as docPurified } from 'dompurify';
import { hasProperHtmlWrapper } from './getTemplateBody';

export function hasXSS(html) {
  if (hasProperHtmlWrapper(html)) {
    const sanitized = htmlSanitized(html);
    return removeBlankLine(sanitized) !== removeBlankLine(html);
  }
  return false;
}

export const htmlSanitized = (html) => {
  return docPurified(html, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] });
};
const removeBlankLine = (input: string) => input.trim().replace(/[^\x20-\x7E]/gim, '');
