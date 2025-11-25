
var stream = require('stream')

var bl = require('bl')
var isstream = require('isstream')
var multistream = require('multistream')

var formdata = require('./formdata')


module.exports = (options, boundary) => {
  var body = []
  var multipart = options instanceof Array ? options : formdata(options)

  // if (options.preambleCRLF) {
  //   body.append('\r\n')
  // }

  multipart.forEach((part) => {
    var preamble = `--${boundary}\r\n`

    var headers = Object.keys(part)
      .filter((key) => key !== 'body')
      .map((key) => `${key}: ${part[key]}`)
      .join('\r\n')

    body.push(preamble + headers + '\r\n\r\n')
    body.push(part.body)
    body.push('\r\n')
  })
  body.push(`--${boundary}--`)

  // if (options.postambleCRLF) {
  //   body.append('\r\n')
  // }

  var arr = body.map((part) => isstream(part) ? part : bl(part))
  var stream = new multistream(arr)
  stream._items = arr // content-length
  stream._raw = body // request-logs

  return stream
}
