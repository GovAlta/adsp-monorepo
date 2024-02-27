import * as handlebars from 'handlebars';
import emailWrapper from './templates/email-wrapper.hbs';
import pdfWrapper from './templates/pdf-wrapper.hbs';
import pdfFooterWrapper from './templates/pdf-footer-wrapper.hbs';
import pdfHeaderWrapper from './templates/pdf-header-wrapper.hbs';

const emailWrapperTemplate = handlebars.compile(emailWrapper, { noEscape: true });
const pdfWrapperTemplate = handlebars.compile(pdfWrapper, { noEscape: true });
const pdfFooterTemplate = handlebars.compile(pdfFooterWrapper, { noEscape: true });
const pdfHeaderTemplate = handlebars.compile(pdfHeaderWrapper, { noEscape: true });

export const hasProperHtmlWrapper = (content: string): boolean => {
  const hasHtmlOpeningTag = /<html[^>]*>/g.test(content) || /<HTML[^>]*>/g.test(content);
  const hasHtmlClosingTag = /<\/html[^>]*>/g.test(content) || /<\/HTML[^>]*>/g.test(content);
  return hasHtmlOpeningTag && hasHtmlClosingTag;
};

export const getTemplateBody = (
  body: string,
  channel: string,
  context?: Record<string, unknown>,
  title?: string,
  subtitle?: string
): string => {
  if (channel === 'pdf-footer') {
    return pdfFooterTemplate({ content: body, ...context });
  } else if (channel === 'pdf-header') {
    return pdfHeaderTemplate({ content: body, ...context });
  } else {
    if (!hasProperHtmlWrapper(body)) {
      if (channel === 'email') {
        return body
          ? emailWrapperTemplate({ content: { body: body, mainTitle: title, subtitle: subtitle }, ...context })
          : body;
      } else if (channel === 'pdf') {
        return pdfWrapperTemplate({ content: body, ...context });
      } else {
        return body;
      }
    }
  }

  return body;
};
