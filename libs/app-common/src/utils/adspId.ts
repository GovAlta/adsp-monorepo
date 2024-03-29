// Note this regex is currently only used for detecting AdspId and not for parsing.
// urn:ads:{namespace}:{service}:{apiVersion}:{resource}
const AdspIdPattern =
  /^urn:ads(?<namespace>:[a-zA-Z0-9-]{1,50})(?<service>:[a-zA-Z0-9-]{1,50})?(?<api>:[a-zA-Z0-9-]{1,50})?(?<resource>:[a-zA-Z0-9-_/ ]{1,1000})?$/;

export class AdspId {
  static isAdspId(urn: string): boolean {
    return typeof urn === 'string' && AdspIdPattern.test(urn);
  }
}
