/// <reference types="node" />
import { Writable } from 'stream';
import tar from 'tar-stream';
/**
 * Create a file path factory for a given path & prefix.
 * Upon being called, the factory will return a file path for a given index
 */
export declare const createFilePathFactory: (type: string) => (fileIndex?: number) => string;
export declare const createTarEntryStream: (archive: tar.Pack, pathFactory: (index?: number) => string, maxSize?: number) => Writable;
//# sourceMappingURL=utils.d.ts.map