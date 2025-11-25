/// <reference types="node" />
import { Cipher } from 'crypto';
import { Algorithm } from '../../../types';
/**
 * It creates a cipher instance used for decryption
 *
 * @param key - The decryption key
 * @param algorithm - The algorithm to use to create the Cipher
 *
 * @returns A {@link Cipher} instance created with the given key & algorithm
 */
export declare const createDecryptionCipher: (key: string, algorithm?: Algorithm) => Cipher;
//# sourceMappingURL=decrypt.d.ts.map