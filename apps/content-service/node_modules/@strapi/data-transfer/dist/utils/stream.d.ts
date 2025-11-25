/// <reference types="node" />
import { Transform, Readable } from 'stream';
type TransformOptions = ConstructorParameters<typeof Transform>[0];
/**
 * Create a filter stream that discard chunks which doesn't satisfies the given predicate
 *
 * @param predicate - A filter predicate, takes a stream data chunk as parameter and returns a boolean value
 * @param options - Transform stream options
 */
export declare const filter: <T>(predicate: (value: T) => boolean | Promise<boolean>, options?: TransformOptions) => Transform;
/**
 * Create a map stream that transform chunks using the given predicate
 *
 * @param predicate - A map predicate, takes a stream data chunk as parameter and returns a mapped value
 * @param options - Transform stream options
 */
export declare const map: <T, U = T>(predicate: (value: T) => U | Promise<U>, options?: TransformOptions) => Transform;
/**
 * Collect every chunks from a Readable stream.
 *
 * @param stream - The redable stream to collect data from
 * @param options.destroy - If set to true, it automatically calls `destroy()` on the given stream upon receiving the 'end' event
 */
export declare const collect: <T = unknown>(stream: Readable, options?: {
    destroy: boolean;
}) => Promise<T[]>;
export {};
//# sourceMappingURL=stream.d.ts.map