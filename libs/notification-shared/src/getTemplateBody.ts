import * as handlebars from 'handlebars';
import emailWrapper from './templates/email-wrapper.hbs';

const emailWrapperTemplate = handlebars.compile(emailWrapper, { noEscape: true });

const hasProperHtmlWrapper = (content: string): boolean => {
  const hasHtmlOpeningTag = /<html[^>]*>/g.test(content) || /<HTML[^>]*>/g.test(content);
  const hasHtmlClosingTag = /<\/html[^>]*>/g.test(content) || /<\/HTML[^>]*>/g.test(content);
  return hasHtmlOpeningTag && hasHtmlClosingTag;
};

export const getTemplateBody = (body: string, context?: Record<string, unknown>): string => {
  if (!hasProperHtmlWrapper(body)) {
    return emailWrapperTemplate({ content: body, ...context });
  }

  return body;
};
