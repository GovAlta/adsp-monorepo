/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/**
 * Utils file containing file treatment utils
 */
import { Writable, WritableOptions } from 'node:stream';
declare const kbytesToBytes: (kbytes: number) => number;
declare const bytesToKbytes: (bytes: number) => number;
declare const bytesToHumanReadable: (bytes: number) => string;
declare const streamToBuffer: (stream: NodeJS.ReadableStream) => Promise<Buffer>;
declare const getStreamSize: (stream: NodeJS.ReadableStream) => Promise<unknown>;
/**
 * Create a writeable Node.js stream that discards received data.
 * Useful for testing, draining a stream of data, etc.
 */
declare function writableDiscardStream(options?: WritableOptions): Writable;
export { streamToBuffer, bytesToHumanReadable, bytesToKbytes, kbytesToBytes, getStreamSize, writableDiscardStream, };
//# sourceMappingURL=file.d.ts.map