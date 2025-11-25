
var uuid = require('uuid').v4
var generate = require('./lib/multipart')


module.exports = (multipart) => ({options, options: {headers}}) => {

  var header = Object.keys(headers)
    .find((name) => name.toLowerCase() === 'content-type')

  var regexp = /^multipart\/([^\s;]+)(?:; boundary=([^\s;]+))?(.*)/
  var content = Array.isArray(multipart) ? 'related' : 'form-data'
  var boundary = uuid()
  var rest = ''

  if (headers[header]) {
    var match = headers[header].match(regexp)
    if (match) {
      content = match[1]
      boundary = match[2] || boundary
      rest = match[3] || ''
    }
  }

  headers['content-type'] = `multipart/${content}; boundary=${boundary}${rest}`
  var body = generate(multipart, boundary)

  return {options, body}

}
