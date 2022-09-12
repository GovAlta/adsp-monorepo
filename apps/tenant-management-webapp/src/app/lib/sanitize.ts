import { addHook } from 'dompurify';
import { sanitize as docPurified } from 'dompurify';
import { hasProperHtmlWrapper } from '@core-services/notification-shared';

export { sanitize as sanitizeHtml } from 'dompurify';
addHook('afterSanitizeAttributes', function (node) {
  // set all elements owning target to target=_blank
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

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
