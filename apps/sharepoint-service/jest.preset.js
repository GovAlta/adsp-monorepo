const nxPreset = require('../../jest.preset.js');
const mongoDbPreset = require('@shelf/jest-mongodb/jest-preset');

module.exports = { ...mongoDbPreset, ...nxPreset };
