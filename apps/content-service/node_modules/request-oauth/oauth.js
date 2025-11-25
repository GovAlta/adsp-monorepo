
var _oauth = require('./lib/oauth')
var url = require('url')


module.exports = (oauth) => ({options, options: {headers}, body}) => {

  var header = Object.keys(options.headers)
    .find((name) => name.toLowerCase() === 'content-type')

  var form
  if (/^application\/x-www-form-urlencoded/.test(headers[header])) {
    form = body
  }

  var uri = url.parse(
    `${options.protocol}//${options.hostname}${options.path}`
      + (options.port ? `:${options.port}` : '')
  )

  var result = _oauth({
    method: options.method,
    url: uri,
    query: uri.query,
    form,
    body,
    oauth,
  })

  if (result instanceof Error) {
    throw result
  }

  var transport = oauth.transport_method || 'header'

  if (transport === 'header') {
    options.headers.Authorization = result
  }
  else if (transport === 'query') {
    options.path += result
  }
  else if (transport === 'body') {
    body = (body || '') + result
  }

  return {options, body}
}
