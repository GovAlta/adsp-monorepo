/**
 * Encodes JSON as a hidden string
 * @param json - The JSON data to encode
 * @returns The hidden string
 */
declare function vercelStegaEncode<T>(json: T): string;
/**
 * Encodes JSON as a hidden string using the original logic
 * @param json - The JSON data to encode
 * @returns The hidden string
 * @deprecated
 */
declare function legacyStegaEncode<T>(json: T): string;
type SkipValue = 'auto' | boolean;
/**
 * Adds an encoded JSON object to a string as hidden characters
 * @param string - The string the JSON will be added to
 * @param json - The JSON to add to the string
 * @param skip - Whether to skip encoding (default: "auto")
 */
declare function vercelStegaCombine<T>(string: string, json: T, skip?: SkipValue): string;

declare const VERCEL_STEGA_REGEX: RegExp;
/**
 * Decodes the first hidden string that's found in the source string back into its original value
 * @param source - The source string with encoded data
 * @returns The decoded JSON value
 */
declare function vercelStegaDecode<T>(source: string): T | undefined;
/**
 * Decodes every hidden string that's found in the source string back into their original values
 * @param source - The source string with encoded data
 * @returns The decoded JSON values
 */
declare function vercelStegaDecodeAll<T>(source: string): T[];

/**
 * Separated clean string and encoded string
 */
interface SplitResult {
    /** The original string with encoded substring removed */
    cleaned: string;
    /** The encoded substring from the original string */
    encoded: string;
}
/**
 * Splits out encoded data from a string, if any is found
 * @param original - The original string
 * @returns The cleaned string and encoded data, separately
 */
declare function vercelStegaSplit(original: string): SplitResult;
/**
 * Removes all stega-encoded data from a JSON value
 */
declare function vercelStegaClean<T>(result: T): T;

export { VERCEL_STEGA_REGEX, legacyStegaEncode, vercelStegaClean, vercelStegaCombine, vercelStegaDecode, vercelStegaDecodeAll, vercelStegaEncode, vercelStegaSplit };
