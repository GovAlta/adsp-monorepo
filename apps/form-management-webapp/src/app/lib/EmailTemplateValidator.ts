import * as xss from 'xss';

/*
 * For email templates we want to restrict javascript (script tags) and external css (link tags),
 * as those could potentially introduce XSS vulnerabilities.  Since this is to help sanitize
 * email templates only, all other tags/attributes are considered safe.
 *
 * We're not really interested in sanitizing an email template either, just pointing out to developers
 * that we don't accept script or link tags.  It is intended for use in the ADSP editors, and they won't save
 * unsafe email templates.  It is up to developers, then, to sanitize their template if they want them
 * used in their applications.  In fact, we're not using the sanitization aspects of the XSS sanitizer at all,
 * we're only using its HTML parser to see if script or link tags were found.  A more efficient approach might
 * be to use an HTML parser directly instead of the sanitizer.
 */
export const checkForProhibitedTags = (html: string): string => {
  let error = '';
  const xssFilter = new xss.FilterXSS({
    onTag: (tag: string, _html: string, _options) => {
      if (tag === 'script' || tag === 'link') {
        error = 'Please remove all script and link tags, to reduce the chance of introducing XSS vulnerabilities';
      }
    },
  });
  xssFilter.process(html);
  return error;
};
