const dependencyModule = require('./dependencyModule');
import { assertAuthenticatedHandler } from '@core-services/core-common';

function getTheSecret() {
  return `The secret was: ${assertAuthenticatedHandler()}`;
}

module.exports = {
  getTheSecret,
};
