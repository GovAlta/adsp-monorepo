import * as handlebars from 'handlebars';
import { TemplateService } from './notification';

export const templateService: TemplateService = {
  generateMessage(template, event, subscriber) { 
    return { 
      subject: handlebars.compile(template.subject)({event, subscriber}), 
      body: handlebars.compile(template.body)({event, subscriber})
    } 
  } 
}
