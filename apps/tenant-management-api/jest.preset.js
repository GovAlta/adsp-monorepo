const basePreset = require('../../jest.preset.js');
const mongoDbPreset = require('@shelf/jest-mongodb/jest-preset');

module.exports = { ...basePreset, ...mongoDbPreset }
