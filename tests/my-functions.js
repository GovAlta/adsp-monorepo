// import { faker } from '@faker-js/faker/locale/en_CA';
const { faker } = require('@faker-js/faker');
function setJSONBody(requestParams, context, ee, next) {
  context.vars.eventName = faker.name.firstName();
  let payload = {
    data: 'data',
  };
  payload = {
    operation: 'UPDATE',
    update: {},
  };
  payload['update'][context.vars.eventName] = {
    name: context.vars.eventName,
    definitions: {
      'artillery-load': {
        name: 'artillery-load',
        description: 'artillery',
        payloadSchema: {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: true,
        },
      },
    },
  };

  context.vars.payload = payload;
  console.log(context.vars.eventName, ' context.vars.eventName ');

  return next(); // MUST be called for the scenario to continue
}
function deleteEvent(requestParams, context, ee, next) {
  let deletePayload = {};
  deletePayload = {
    operation: 'DELETE',
    property: context.vars.eventName,
  };

  context.vars.deletePayload = deletePayload;
  return next(); // MUST be called for the scenario to continue
}

function logHeaders(requestParams, response, context, ee, next) {
  console.log(response.body, ' response ');
  console.log(context.vars.eventName, ' context.vars.eventName ');
  return next(); // MUST be called for the scenario to continue
}
module.exports = {
  setJSONBody,
  logHeaders,
  deleteEvent,
};
