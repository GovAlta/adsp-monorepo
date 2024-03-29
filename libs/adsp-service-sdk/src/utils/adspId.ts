import { GoAError, GoAErrorExtra } from './errors';
import * as HttpStatusCodes from 'http-status-codes';
const PREFIX = 'urn:ads:';

// Note this regex is currently only used for detecting AdspId and not for parsing.
// urn:ads:{namespace}:{service}:{apiVersion}:{resource}
const AdspIdPattern =
  /^urn:ads(?<namespace>:[a-zA-Z0-9-]{1,50})(?<service>:[a-zA-Z0-9-]{1,50})?(?<api>:[a-zA-Z0-9-]{1,50})?(?<resource>:[a-zA-Z0-9-_/ ]{1,1000})?$/;

export class AdspIdFormatError extends GoAError {
  constructor(message: string, extra?: GoAErrorExtra) {
    super(message, { statusCode: HttpStatusCodes.BAD_REQUEST, ...extra });
    Object.setPrototypeOf(this, AdspIdFormatError.prototype);
  }
}

export type ResourceType = 'namespace' | 'service' | 'api' | 'resource';

/**
 * AdspId: Utility class for handling ADSP URNs.
 */
export class AdspId {
  static isAdspId(urn: unknown): boolean {
    return typeof urn === 'string' && AdspIdPattern.test(urn);
  }

  static parse(urn: string): AdspId {
    // urn:ads:{namespace}:{service}:{apiVersion}:{resource}
    if (!urn?.startsWith(PREFIX)) {
      throw new AdspIdFormatError(`ADSP ID (${urn}) must begin with: ${PREFIX}`);
    }

    const elements = urn.substring(PREFIX.length).split(':');
    const emptyElement = elements.find((e) => !e.trim());
    if (emptyElement) {
      throw new AdspIdFormatError('ADSP ID cannot include empty element.');
    }

    let type: ResourceType;
    if (elements.length === 1) {
      type = 'namespace';
    } else if (elements.length === 2) {
      type = 'service';
    } else if (elements.length === 3) {
      type = 'api';
    } else if (elements.length === 4) {
      type = 'resource';
    } else {
      throw new Error(`Value is not a valid ADSP ID: ${urn}`);
    }

    return new AdspId(type, elements[0], elements[1], elements[2], elements[3]);
  }

  private constructor(
    public type: ResourceType,
    public namespace: string,
    public service: string,
    public api: string,
    public resource: string
  ) {}

  #formatSegment = (segment: string): string => {
    return segment ? `:${segment}` : '';
  };

  toString = (): string =>
    `${PREFIX}${this.namespace}` +
    this.#formatSegment(this.service) +
    this.#formatSegment(this.api) +
    this.#formatSegment(this.resource);
}

/**
 * adspsId: tagged literal function for ADSP URNs
 * @param strings
 * @param parameters
 * @returns Parsed AdspId
 */
export function adspId(strings: TemplateStringsArray, ...parameters: unknown[]): AdspId {
  const combined = strings.reduce((result, string, i) => {
    return result + string + `${parameters[i] || ''}`;
  }, '');

  return AdspId.parse(combined);
}

export function assertAdspId(id: AdspId, errorMessage?: string, ...types: ResourceType[]): void {
  if (!id || !types.includes(id.type)) {
    throw new Error(errorMessage || `ID must for resource type of: ${types.join(', ')}`);
  }
}
