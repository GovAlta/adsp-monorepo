const fs = require('fs');
const FormData = require('form-data');

function setFormFile(requestParams, context, _ee, next) {
  const { typeId, filename } = context.vars;

  const form = new FormData();
  form.append('type', typeId);
  form.append('file', fs.createReadStream(`${__dirname}/files/${filename}`), { filename });
  requestParams.body = form;
  requestParams.headers = {
    ...requestParams.headers,
    ...form.getHeaders(),
  };

  return next();
}

module.exports = {
  setFormFile,
};
