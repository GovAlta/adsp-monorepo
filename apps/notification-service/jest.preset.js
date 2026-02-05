/* eslint-disable @typescript-eslint/no-var-requires */
const basePreset = require('../../jest-cover.preset.js');
const mongoDbPreset = require('@shelf/jest-mongodb/jest-preset');

module.exports = { ...mongoDbPreset, ...basePreset };
