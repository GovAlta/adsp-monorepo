'use strict';

var crypto = require('node:crypto');
var _ = require('lodash/fp');

/**
 * Creates a hash of the given data with the specified string length as a string of hex characters
 *
 * @example
 * createHash("myData", 5); // "03f85"
 * createHash("myData", 2); // "03"
 * createHash("myData", 1); // "0"
 *
 * @param data - The data to be hashed
 * @param len - The length of the hash
 * @returns The generated hash
 * @throws Error if the length is not a positive integer
 * @internal
 */ function createHash(data, len) {
    if (!_.isInteger(len) || len <= 0) {
        throw new Error(`createHash length must be a positive integer, received ${len}`);
    }
    const hash = crypto.createHash('shake256', {
        outputLength: Math.ceil(len / 2)
    }).update(data);
    return hash.digest('hex').substring(0, len);
}

exports.createHash = createHash;
//# sourceMappingURL=hash.js.map
