import * as handlebars from 'handlebars';
import emailWrapper from './templates/email-wrapper.hbs';

const emailWrapperTemplate = handlebars.compile(emailWrapper, { noEscape: true });

const hasProperHtmlWrapper = (content: string): boolean => {
  const hasHtmlOpeningTag = /<html[^>]*>/g.test(content) || /<HTML[^>]*>/g.test(content);
  const hasHtmlClosingTag = /<\/html[^>]*>/g.test(content) || /<\/HTML[^>]*>/g.test(content);
  return hasHtmlOpeningTag && hasHtmlClosingTag;
};

export const getTemplateBody = (body: string, channel: string, context?: Record<string, unknown>): string => {
  if (!hasProperHtmlWrapper(body)) {
    console.log(JSON.stringify(channel) + '<templateBodyChannel');
    if (channel === 'email') {
      return emailWrapperTemplate({ content: body, ...context });
    } else {
      return body;
    }
  }

  return body;
};
