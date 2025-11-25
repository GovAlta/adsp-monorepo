/// <reference types="node" />
import { Cipher } from 'crypto';
import { Algorithm } from '../../../types';
/**
 * It creates a cipher instance used for encryption
 *
 * @param key - The encryption key
 * @param algorithm - The algorithm to use to create the Cipher
 *
 * @returns A {@link Cipher} instance created with the given key & algorithm
 */
export declare const createEncryptionCipher: (key: string, algorithm?: Algorithm) => Cipher;
//# sourceMappingURL=encrypt.d.ts.map