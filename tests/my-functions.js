function setJSONBody(requestParams, context, ee, next) {
  let payload = {
    data: 'data',
  };
  payload = {
    operation: 'UPDATE',
    update: {
      artillery: {
        name: 'artillery',
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
      },
    },
  };

  context.vars.payload = payload;
  return next(); // MUST be called for the scenario to continue
}
function deleteEvent(requestParams, context, ee, next) {
  let deletePayload = {};
  deletePayload = {
    operation: 'DELETE',
    property: 'artillery',
  };

  context.vars.deletePayload = deletePayload;
  return next(); // MUST be called for the scenario to continue
}

function logHeaders(requestParams, response, context, ee, next) {
  console.log(response.body, ' response ');
  return next(); // MUST be called for the scenario to continue
}
module.exports = {
  setJSONBody,
  logHeaders,
  deleteEvent,
};
