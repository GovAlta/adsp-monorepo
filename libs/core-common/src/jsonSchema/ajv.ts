import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020';
import type AjvCore from 'ajv/dist/core';
import * as draft07MetaSchema from 'ajv/dist/refs/json-schema-draft-07.json';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import * as schemaMigration from 'json-schema-migrate';
import { Logger } from 'winston';
import { InvalidValueError } from '../errors';
import { ValidationService } from './service';

// The named input formats of the form renderer (DEFAULT_PATTERNS in @abgov/jsonforms-components). Without them,
// compiling a form schema that uses one fails with 'unknown format' and every submission of that form is rejected.
// As in the form app, an empty value passes so an optional field can be left blank.
const NAMED_FORMAT_PATTERNS: Record<string, RegExp> = {
  sin: /^\d{3} \d{3} \d{3}$/,
  postalCode: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
  driverId: /^\d{6}-\d{3}$/,
  mvid: /^\d{4}-\d{5}$/,
};

function hasValidSinChecksum(sin: string): boolean {
  const sum = sin
    .replace(/\D/g, '')
    .split('')
    .map(Number)
    .reverse()
    .reduce((total, digit, index) => {
      const value = index % 2 === 1 ? digit * 2 : digit;
      return total + (value > 9 ? value - 9 : value);
    }, 0);
  return sum % 10 === 0;
}

function namedFormat(format: string, pattern: RegExp) {
  return (input: string) => !input || (pattern.test(input) && (format !== 'sin' || hasValidSinChecksum(input)));
}

const AJV_OPTIONS = { allErrors: true, verbose: true, strict: 'log', strictRequired: false, useDefaults: true } as const;

const DRAFT_2020_12_SCHEMA = /^https?:\/\/json-schema\.org\/draft\/2020-12\/schema#?$/;

// Ajv parses schema keys as URIs, so a key like 'my_namespace:name' or '123-namespace:name' fails with
// 'URI scheme is malformed'. Encoding the key under a fixed scheme keeps any key usable.
function toAjvKey(schemaKey: string): string {
  return `adsp-schema:${encodeURIComponent(schemaKey)}`;
}

export class AjvValidationService implements ValidationService {
  protected ajv = new Ajv(AJV_OPTIONS);
  protected ajvErrors: string[] = [];
  // Created on first use: most schemas are draft-07, and a service can create many validation services.
  private ajv2020: Ajv2020;
  private ajv2020Keys = new Set<string>();

  constructor(private logger: Logger) {
    this.configure(this.ajv);
  }

  private configure(ajv: AjvCore): void {
    addFormats(ajv);
    addErrors(ajv);

    ajv.addFormat('file-urn', {
      type: 'string',
      validate: (input) => {
        const fileUrnRegExp = new RegExp('^urn:ads:platform:file-service:v[0-9]:/files/[a-zA-Z0-9.-]*$');
        const fileUrns = input.split(';');
        for (const urn of fileUrns) {
          if (!fileUrnRegExp.test(urn)) {
            return false;
          }
        }
        return true;
      },
    });
    ajv.addFormat('phone', /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/);
    ajv.addFormat('time', /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);
    ajv.addFormat('computed', /^[a-zA-Z0-9._-]+$/);
    Object.entries(NAMED_FORMAT_PATTERNS).forEach(([format, pattern]) =>
      ajv.addFormat(format, namedFormat(format, pattern))
    );
    ajv.addSchema(standardV1JsonSchema);
    ajv.addSchema(commonV1JsonSchema);
  }

  private getAjv2020(): Ajv2020 {
    if (!this.ajv2020) {
      this.ajv2020 = new Ajv2020(AJV_OPTIONS);
      // The standard schemas declare draft-07.
      this.ajv2020.addMetaSchema(draft07MetaSchema);
      this.configure(this.ajv2020);
    }
    return this.ajv2020;
  }

  private getAjvFor(schemaKey: string): AjvCore {
    return this.ajv2020Keys.has(schemaKey) ? this.ajv2020 : this.ajv;
  }

  setSchema(schemaKey: string, schema: Record<string, unknown>): void {
    if (schema?.$async) {
      throw new Error(`Schema for key '${schemaKey}' uses an async schema which is not supported.`);
    }

    const ajvKey = toAjvKey(schemaKey);
    try {
      if (schema?.$schema === 'http://json-schema.org/draft-04/schema#') {
        schemaMigration.draft7(schema);
      }

      this.ajv.removeSchema(ajvKey);
      this.ajv2020?.removeSchema(ajvKey);
      this.ajv2020Keys.delete(schemaKey);

      const isDraft2020 = typeof schema?.$schema === 'string' && DRAFT_2020_12_SCHEMA.test(schema.$schema);
      const ajv: AjvCore = isDraft2020 ? this.getAjv2020() : this.ajv;
      ajv.addSchema(this.removeEmptyEnum(schema) || {}, ajvKey);
      if (isDraft2020) {
        this.ajv2020Keys.add(schemaKey);
      }
    } catch (err) {
      this.logger.error(`Schema for key '${schemaKey}' is invalid: ${err?.message}`);
      throw err;
    }
  }

  validate(context: string, schemaKey: string, value: unknown): void {
    const ajv = this.getAjvFor(schemaKey);
    const result = ajv.validate(toAjvKey(schemaKey), value);
    if (!result) {
      const errors = ajv.errorsText(ajv.errors);
      throw new InvalidValueError(context, errors);
    }
  }

  removeEmptyEnum(schema: Record<string, unknown>): Record<string, unknown> {
    const newSchema = JSON.parse(JSON.stringify(schema));

    Object.keys(newSchema?.properties || {}).forEach((propertyName) => {
      const property = newSchema.properties || {};
      if (property[propertyName]?.enum?.length === 1 && property[propertyName]?.enum[0] === '')
        delete property[propertyName].enum;
    });

    return newSchema;
  }
}
