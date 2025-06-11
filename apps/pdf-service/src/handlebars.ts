import * as handlebars from 'handlebars';
import { DateTime } from 'luxon';
import { TemplateService } from './pdf';
import { getTemplateBody } from '@core-services/notification-shared';
import { ServiceDirectory, adspId } from '@abgov/adsp-service-sdk';
import { validate } from 'uuid';
import * as NodeCache from 'node-cache';
import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import * as fs from 'fs';

const TIME_ZONE = 'America/Edmonton';
handlebars.registerHelper('formatDate', function (value: unknown, { hash = {} }: { hash: Record<string, string> }) {
  try {
    if (value instanceof Date) {
      value = DateTime.fromJSDate(value)
        .setZone(TIME_ZONE)
        .toFormat(hash.format || 'ff ZZZZ');
    } else if (typeof value === 'string') {
      value = DateTime.fromISO(value)
        .setZone(TIME_ZONE)
        .toFormat(hash.format || 'ff ZZZZ');
    }
  } catch (err) {
    // If this fails, then just fallback to default.
  }
  return value;
});

const resolveLabelFromScope = (scope: string) => {
  // eslint-disable-next-line no-useless-escape
  const validPatternRegex = /^#(\/properties\/[^\/]+)+$/;
  const isValid = validPatternRegex.test(scope);
  if (!isValid) return null;

  const lastSegment = scope.split('/').pop();

  if (lastSegment) {
    const lowercased = lastSegment.replace(/([A-Z])/g, ' $1').toLowerCase();

    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }
  return '';
};

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

const getFormFieldValue = (scope: string, data: object) => {
  if (data !== undefined) {
    const pathArray = scope.replace('#/properties/', '').replace('properties/', '').split('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentValue: any = data;

    for (const key of pathArray) {
      if (currentValue[key] === undefined) {
        return '';
      }
      currentValue = currentValue[key];
    }

    return Array.isArray(currentValue)
      ? currentValue[currentValue.length - 1]
      : typeof currentValue === 'object'
      ? ''
      : currentValue;
  } else {
    return '';
  }
};

function sentenceCase(input) {
  let formattedString = input.replace(/([A-Z0-9])/g, ' $1').toLowerCase();
  formattedString = formattedString.trim();
  formattedString = formattedString.charAt(0).toUpperCase() + formattedString.slice(1);
  return formattedString;
}

export const getAllRequiredFields = (schema: JsonSchema4 | JsonSchema7): string[] => {
  const requiredFields: string[] = [];

  function findRequired(fields: JsonSchema4 | JsonSchema7) {
    if (fields && fields.required && Array.isArray(fields.required)) {
      fields.required.forEach((field: string) => {
        requiredFields.push(field);
      });
    }

    if (fields !== undefined && fields.properties) {
      Object.keys(fields.properties).forEach((key) => {
        if (fields.properties) {
          findRequired(fields.properties[key]);
        }
      });
    } else if (fields && fields.type === 'array' && fields.items && typeof fields.items === 'object') {
      const childItems: JsonSchema4 = JSON.parse(JSON.stringify(fields.items));
      findRequired(childItems);
    }
  }
  findRequired(schema);
  return requiredFields;
};

const valueMap = (value: string) => {
  const mapping = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' },
    { value: 'CA', label: 'Canada' },
  ];

  const found = mapping.find((item) => item.value === value);
  if (found) {
    return found.label;
  } else {
    return value;
  }
};

class HandlebarsTemplateService implements TemplateService {
  fileServiceCache: NodeCache;

  constructor(private readonly directory: ServiceDirectory) {
    this.fileServiceCache = new NodeCache({
      stdTTL: 0,
      useClones: false,
    });

    this.directory.getServiceUrl(adspId`urn:ads:platform:file-service`).then((result) => {
      this.fileServiceCache.set('fileServiceUrl', result.toString());
    });
  }

  getTemplateFunction(template: string, channel?: string) {
    const styledTemplate = getTemplateBody(template, channel || 'pdf', {});
    const fileServiceUrl = this.fileServiceCache.get('fileServiceUrl') as string;

    handlebars.registerHelper('fileId', function (value: string) {
      let returnValue = '';

      try {
        if (typeof value === 'string' && value.slice(0, 4) === 'urn:') {
          if (value.indexOf('urn:ads:platform:file-service') !== -1) {
            returnValue = value.split('/')[value.split('/').length - 1];
          } else {
            return null;
          }
        } else if (validate(value)) {
          returnValue = value;
        } else {
          return null;
        }
      } catch (err) {
        console.error(err);
      }

      return `${fileServiceUrl}file/v1/files/${returnValue}/download?unsafe=true&embed=true`;
    });

    handlebars.registerPartial('elements', fs.readFileSync('./apps/pdf-service/src/pdf/partials/elements.hbs', 'utf8'));

    handlebars.registerHelper('isRequiredField', function (requiredFields, element) {
      const lastSegment: string = element.scope?.split('/').pop();
      const isRequired = requiredFields && requiredFields.includes(lastSegment);
      return isRequired;
    });

    handlebars.registerHelper('requiredField', function (dataSchema) {
      const requiredFields = dataSchema && getAllRequiredFields(dataSchema);
      return requiredFields;
    });

    handlebars.registerHelper('isGroup', function (element) {
      return element.type === 'Group';
    });

    handlebars.registerHelper('isControlAndHasScope', function (element) {
      return element.type === 'Control' && element.scope;
    });
    handlebars.registerHelper('isListWithDetailAndHasScope', function (element) {
      return element.type === 'ListWithDetail' && element.scope;
    });
    handlebars.registerHelper('hasOptionElements', function (element) {
      return element?.options?.detail?.elements;
    });
    handlebars.registerHelper('hasElements', function (element) {
      return element?.elements;
    });
    handlebars.registerHelper('isArray', function (element, data) {
      if (data !== undefined) {
        const pathArray = element.scope.replace('#/properties/', '').replace('properties/', '').split('/');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentValue: any = data;

        for (const key of pathArray) {
          if (currentValue[key] === undefined) {
            return '';
          }
          currentValue = currentValue[key];
        }

        return Array.isArray(currentValue);
      } else {
        return false;
      }
    });

    handlebars.registerHelper('isObject', function (element, data) {
      if (data !== undefined) {
        const pathArray = element.scope.replace('#/properties/', '').replace('properties/', '').split('/');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentValue: any = data;

        for (const key of pathArray) {
          if (currentValue[key] === undefined) {
            return '';
          }
          currentValue = currentValue[key];
        }

        return isObject(currentValue);
      } else {
        return false;
      }
    });

    handlebars.registerHelper('grabDataArray', function (context, element, requiredFields, options) {
      let ret = '';
      if (!options) {
        options = { ...requiredFields };
        requiredFields = null;
      }

      const pathArray = element.scope.replace('#/properties/', '').replace('properties/', '').split('/');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let currentValue: any = context;
      for (const key of pathArray) {
        if (currentValue[key] === undefined) {
          return '';
        }
        currentValue = currentValue[key];
      }
      const extendedContext = Object.assign({}, currentValue, { params: { requiredFields, element } });
      ret = ret + options.fn(extendedContext);
      return ret;
    });

    handlebars.registerHelper('scopeName', function (scope) {
      const scopeName = scope.replace('#/properties/', '');
      const firstCap = scopeName.charAt(0).toUpperCase() + scopeName.substring(1);
      return firstCap;
    });

    handlebars.registerHelper('withEach', function (context, data, requiredFields, dataSchema, options) {
      let ret = '';

      if (!options) {
        options = { ...requiredFields };
        requiredFields = null;
      }

      for (let i = 0, j = context.length; i < j; i++) {
        const extendedContext = Object.assign({}, context[i], { params: { data, requiredFields, dataSchema } });
        ret = ret + options.fn(extendedContext);
      }

      return ret;
    });

    handlebars.registerHelper('eachDetail', function (context, data, requiredFields, options) {
      let ret = '';
      if (!options) {
        options = { ...requiredFields };
        requiredFields = null;
      }

      for (let i = 0, j = context.length; i < j; i++) {
        const extendedContext = Object.assign({}, context[i], { params: { requiredFields, data } });
        ret = ret + options.fn(extendedContext);
      }
      return ret;
    });

    handlebars.registerHelper('withEachData', function (context, scope, requiredFields, element, options) {
      let ret = '';
      const scopeName = scope.replace('#/properties/', '');

      if (!options) {
        options = { ...requiredFields };
        requiredFields = null;
      }

      const dataArray = context && context[scopeName];

      if (dataArray) {
        for (let i = 0, j = dataArray.length; i < j; i++) {
          const extendedContext = Object.assign({}, dataArray[i], { params: { requiredFields, element } });
          ret = ret + options.fn(extendedContext);
        }
      }

      return ret;
    });

    handlebars.registerHelper(
      'withEachDataWithItems',
      function (context, scope, requiredFields, element, dataSchema, dataSchemaAgain, options) {
        let ret = '';
        const scopeName = scope.replace('#/properties/', '');

        if (!options) {
          options = { ...requiredFields };
          requiredFields = null;
        }

        const validDataSchema = dataSchema || dataSchemaAgain;
        const items = validDataSchema?.properties[scopeName].items?.properties;
        const dataArray = context[scopeName];

        for (let i = 0, j = dataArray.length; i < j; i++) {
          const extendedContext = Object.assign({}, dataArray[i], {
            params: { requiredFields, element, items: items || dataArray[i] || [] },
          });
          ret = ret + options.fn(extendedContext);
        }

        return ret;
      }
    );
    handlebars.registerHelper(
      'withItemsObject',
      function (context, scope, requiredFields, element, dataSchema, dataSchemaAgain, options) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentValue: any = context;

        const pathArray = element.scope.replace('#/properties/', '').replace('properties/', '').split('/');

        for (const key of pathArray) {
          if (currentValue[key] === undefined) {
            return '';
          }
          currentValue = currentValue[key];
        }

        let ret = '';
        const scopeName = scope.replace('#/properties/', '');

        if (!options) {
          options = { ...requiredFields };
          requiredFields = null;
        }

        const validDataSchema = dataSchema || dataSchemaAgain;
        const items = validDataSchema?.properties[scopeName].properties;
        const dataArray = context[scopeName];

        const extendedContext = Object.assign({}, dataArray, {
          params: {
            requiredFields,
            element,
            items: items || dataArray || {},
            title: sentenceCase(pathArray[0]),
          },
        });
        ret = ret + options.fn(extendedContext);

        return ret;
      }
    );

    handlebars.registerHelper('forEachItemObject', function (context, data, requiredFields, options) {
      let ret = '';

      Object.keys(context).forEach(function (key) {
        const element = {
          type: 'Control',
          scope: key,
          label: key,
        };

        const extendedContext = Object.assign({}, element, { params: { requiredFields, data, element } });
        ret = ret + options.fn(extendedContext);
      });

      return ret;
    });

    handlebars.registerHelper('forEachItem', function (context, data, requiredFields, options) {
      let ret = '';

      Object.keys(context).forEach(function (key) {
        const element = {
          type: 'Control',
          scope: key,
          label: key,
        };

        const extendedContext = Object.assign({}, element, { params: { requiredFields, data, element } });
        ret = ret + options.fn(extendedContext);
      });

      return ret;
    });

    handlebars.registerHelper('label', function (element) {
      let label = element?.label ? element.label : resolveLabelFromScope(element.scope);

      if (label === 'subdivisionCode') {
        label = 'Province';
      }

      label = sentenceCase(label);

      return label;
    });

    handlebars.registerHelper('value', function (element, data) {
      let value = getFormFieldValue(element.scope, data ? data : {});

      let urnCount = 0;

      if (typeof value === 'string') {
        const parts = value.split(';');
        for (const part of parts) {
          if (part.startsWith('urn:')) {
            urnCount++;
          }
        }
      }

      if (urnCount > 0) {
        value = `${urnCount} file${urnCount > 1 && 's'} uploaded`;
      } else {
        value = valueMap(value);
      }

      return value;
    });
    handlebars.registerHelper('isControl', function (element) {
      return element.type === 'Control';
    });
    handlebars.registerHelper('isDataSchema', function (dataSchema) {
      return !!dataSchema;
    });
    handlebars.registerHelper('hasTypeControlOrList', function (element) {
      return element?.type === 'Control' || element?.type === 'ListWithDetail';
    });

    handlebars.registerHelper('hasElements', function (element) {
      return element?.elements && element.elements.length > 0;
    });

    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    return handlebars.compile(styledTemplate, { noEscape: true });
  }
}

export function createTemplateService(directory: ServiceDirectory): TemplateService {
  return new HandlebarsTemplateService(directory);
}
