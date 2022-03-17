import { addHook } from 'dompurify';
export { sanitize as sanitizeHtml } from 'dompurify';

addHook('afterSanitizeAttributes', function (node) {
  // set all elements owning target to target=_blank
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});
