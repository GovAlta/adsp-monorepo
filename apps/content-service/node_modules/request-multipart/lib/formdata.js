
var path = require('path')
var stream = require('stream')
var mime = require('mime-types')


var contentType = (body, options = {}) =>
  options.type ? options.type :
  // fs.ReadStream
  body.path ? mime.lookup(body.path) :
  // http.IncomingMessage
  body.hasOwnProperty('httpVersion') ? body.headers['content-type'] :
  options.name ? mime.lookup(options.name) :
  typeof body === 'object' ?  'application/octet-stream' :
  typeof body === 'string' ? 'text/plain' : ''


var contentDisposition = (body, options = {}) => {
  // options || fs.ReadStream
  var name = path.basename(options.name || body.path || '')
  return name ? `; filename="${path.basename(name)}"` : ''
}


module.exports = (options) =>
  Object.keys(options)
    .map((name) => ({name, body: options[name]}))
    .map(({name, body}) =>
      body.options ? {name, body: body.body, options: body.options} : {name, body})
    .map(({name, body, options}) => (
      (body instanceof stream.Stream && options && options.length)
        ? body._knownLength = options.length : null,
      {name, body, options}
    ))
    .map(({name, body, options}) =>
      body instanceof Array ? body.map((b) => ({name, body: b})) : {name, body, options})
    .reduce((all, part) => all.concat(part), [])
    .map(({name, body, options}) => ({
      'Content-Disposition': `form-data; name="${name}"` + contentDisposition(body, options),
      'Content-Type': contentType(body, options),
      body
    }))
