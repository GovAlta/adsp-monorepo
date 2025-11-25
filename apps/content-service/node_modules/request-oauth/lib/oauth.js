
var crypto = require('crypto')
var qs = require('qs')
var uuid = require('uuid').v4
var _oauth = require('oauth-sign')


function oauth (options) {
  return build(
    options.oauth, options.url, options.method,
    options.url.query, options.form, options.body
  )
}

function build (oauth, uri, method, query, form, body) {
  var transport = oauth.transport_method || 'header'

  if (transport === 'body' && (method !== 'POST' || form === undefined)) {
    return new Error(
      'oauth: transport_method: body requires POST ' +
      'and content-type: application/x-www-form-urlencoded'
    )
  }

  if (oauth.body_hash && form === undefined) {
    var sig = oauth.signature_method || 'HMAC-SHA1'
    if (['HMAC-SHA1', 'RSA-SHA1'].indexOf(sig) < 0) {
      return new Error(
        'oauth: ' + oauth.signature_method + ' signature_method' +
        ' not supported with body_hash signing'
      )
    }
    if (typeof oauth.body_hash === 'boolean') {
      oauth.body_hash = buildBodyHash(oauth, body)
    }
  }

  var oa = buildParams(oauth, uri, method, query, form)

  var prefix, params
  if (transport === 'header') {
    prefix = 'OAuth '
    params = concatParams(oa, ',', '"')
  }
  else if (transport === 'query') {
    prefix = (query ? '&' : '?')
    params = concatParams(oa, '&')
  }
  else if (transport === 'body') {
    prefix = (form ? '&' : '')
    params = concatParams(oa, '&')
  }
  else {
    return new Error('oauth: transport_method invalid')
  }

  return prefix + params
}

function buildBodyHash (oauth, body) {
  var shasum = crypto.createHash('sha1')
  shasum.update(body.toString())
  var sha1 = shasum.digest('hex')

  return Buffer.from(sha1, 'hex').toString('base64')
}

function buildParams (oauth, uri, method, query, form) {
  var oa = {}
  for (var key in oauth) {
    var param = (!/^oauth_/.test(key)) ? ('oauth_' + key) : key
    oa[param] = oauth[key]
  }
  if (!oa.oauth_version) {
    oa.oauth_version = '1.0'
  }
  if (!oa.oauth_timestamp) {
    oa.oauth_timestamp = Math.floor(Date.now() / 1000).toString()
  }
  if (!oa.oauth_nonce) {
    oa.oauth_nonce = uuid().replace(/-/g, '')
  }
  if (!oa.oauth_signature_method) {
    oa.oauth_signature_method = 'HMAC-SHA1'
  }

  var consumer_secret_or_private_key =
    oa.oauth_consumer_secret || oa.oauth_private_key
  delete oa.oauth_consumer_secret
  delete oa.oauth_private_key

  var token_secret = oa.oauth_token_secret
  delete oa.oauth_token_secret

  var realm = oa.oauth_realm
  delete oa.oauth_realm
  delete oa.oauth_transport_method

  var baseurl = uri.protocol + '//' + uri.host + uri.pathname
  var params = qs.parse([].concat(query, form, qs.stringify(oa)).join('&'))

  oa.oauth_signature = _oauth.sign(
    oa.oauth_signature_method,
    method,
    baseurl,
    params,
    consumer_secret_or_private_key,
    token_secret)

  if (realm) {
    oa.realm = realm
  }

  return oa
}

function concatParams (oauth, sep, wrap) {
  wrap = wrap || ''

  var params = Object.keys(oauth).filter(function (i) {
    return i !== 'realm' && i !== 'oauth_signature'
  }).sort()

  if (oauth.realm) {
    params.splice(0, 0, 'realm')
  }
  params.push('oauth_signature')

  return params.map(function (i) {
    return i + '=' + wrap + _oauth.rfc3986(oauth[i]) + wrap
  }).join(sep)
}

module.exports = oauth
