import { scryptSync, createDecipheriv } from 'crypto';

// different key values depending on algorithm chosen
const getDecryptionStrategy = (algorithm)=>{
    const strategies = {
        'aes-128-ecb' (key) {
            const hashedKey = scryptSync(key, '', 16);
            const initVector = null;
            const securityKey = hashedKey;
            return createDecipheriv(algorithm, securityKey, initVector);
        },
        aes128 (key) {
            const hashedKey = scryptSync(key, '', 32);
            const initVector = hashedKey.slice(16);
            const securityKey = hashedKey.slice(0, 16);
            return createDecipheriv(algorithm, securityKey, initVector);
        },
        aes192 (key) {
            const hashedKey = scryptSync(key, '', 40);
            const initVector = hashedKey.slice(24);
            const securityKey = hashedKey.slice(0, 24);
            return createDecipheriv(algorithm, securityKey, initVector);
        },
        aes256 (key) {
            const hashedKey = scryptSync(key, '', 48);
            const initVector = hashedKey.slice(32);
            const securityKey = hashedKey.slice(0, 32);
            return createDecipheriv(algorithm, securityKey, initVector);
        }
    };
    return strategies[algorithm];
};
/**
 * It creates a cipher instance used for decryption
 *
 * @param key - The decryption key
 * @param algorithm - The algorithm to use to create the Cipher
 *
 * @returns A {@link Cipher} instance created with the given key & algorithm
 */ const createDecryptionCipher = (key, algorithm = 'aes-128-ecb')=>{
    return getDecryptionStrategy(algorithm)(key);
};

export { createDecryptionCipher };
//# sourceMappingURL=decrypt.mjs.map
