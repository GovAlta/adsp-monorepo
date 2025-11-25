'use strict';

var crypto = require('crypto');

// different key values depending on algorithm chosen
const getEncryptionStrategy = (algorithm)=>{
    const strategies = {
        'aes-128-ecb' (key) {
            const hashedKey = crypto.scryptSync(key, '', 16);
            const initVector = null;
            const securityKey = hashedKey;
            return crypto.createCipheriv(algorithm, securityKey, initVector);
        },
        aes128 (key) {
            const hashedKey = crypto.scryptSync(key, '', 32);
            const initVector = hashedKey.slice(16);
            const securityKey = hashedKey.slice(0, 16);
            return crypto.createCipheriv(algorithm, securityKey, initVector);
        },
        aes192 (key) {
            const hashedKey = crypto.scryptSync(key, '', 40);
            const initVector = hashedKey.slice(24);
            const securityKey = hashedKey.slice(0, 24);
            return crypto.createCipheriv(algorithm, securityKey, initVector);
        },
        aes256 (key) {
            const hashedKey = crypto.scryptSync(key, '', 48);
            const initVector = hashedKey.slice(32);
            const securityKey = hashedKey.slice(0, 32);
            return crypto.createCipheriv(algorithm, securityKey, initVector);
        }
    };
    return strategies[algorithm];
};
/**
 * It creates a cipher instance used for encryption
 *
 * @param key - The encryption key
 * @param algorithm - The algorithm to use to create the Cipher
 *
 * @returns A {@link Cipher} instance created with the given key & algorithm
 */ const createEncryptionCipher = (key, algorithm = 'aes-128-ecb')=>{
    return getEncryptionStrategy(algorithm)(key);
};

exports.createEncryptionCipher = createEncryptionCipher;
//# sourceMappingURL=encrypt.js.map
