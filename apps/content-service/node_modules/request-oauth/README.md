
# request-oauth

[![npm-version]][npm] [![travis-ci]][travis] [![coveralls-status]][coveralls]

> _OAuth 1.0a support for **[request-compose]**_

```js
var request = require('request-compose').extend({
  Request: {oauth: require('request-oauth')}
}).client

;(async () => {
  try {
    var {res, body} = await request({
      url: 'https://api.twitter.com/1.1/users/show.json',
      qs: {
        screen_name: '[SCREEN NAME]'
      },
      oauth: {
        consumer_key: '[APP ID]',
        consumer_secret: '[APP SECRET]',
        token: '[ACCESS TOKEN]',
        token_secret: '[ACCESS SECRET]',
      }
    })
    console.log(body)
  }
  catch (err) {
    console.error(err)
  }
})()
```


# Options

| Option                 | Description
| :-                     | :-
| **Required**           |
| **`consumer_key`**     | OAuth application key
| **`consumer_secret`**  | OAuth application secret
| **`private_key`**      | in PEM format, set this key instead of `consumer_secret` when using `RSA-SHA1` signing
| **`token`**            | user's access token
| **`token_secret`**     | user's token secret
| **Defaults**           |
| **`version`**          | **`1.0`**
| **`signature_method`** | **`HMAC-SHA1`**, `RSA-SHA1`, `PLAINTEXT`
| **`transport_method`** | **`header`**, `query`, `form`
| **Generated**          |
| **`timestamp`**        |
| **`nonce`**            |
| **`signature`**        |
| **Optional**           |
| **`realm`**            |
| **`body_hash`**        | body hash string to use or `true` to get one generated for you


  [npm-version]: https://img.shields.io/npm/v/request-oauth.svg?style=flat-square (NPM Package Version)
  [travis-ci]: https://img.shields.io/travis/simov/request-oauth/master.svg?style=flat-square (Build Status - Travis CI)
  [coveralls-status]: https://img.shields.io/coveralls/simov/request-oauth.svg?style=flat-square (Test Coverage - Coveralls)

  [npm]: https://www.npmjs.com/package/request-oauth
  [travis]: https://travis-ci.org/simov/request-oauth
  [coveralls]: https://coveralls.io/github/simov/request-oauth

  [request-compose]: https://www.npmjs.com/package/request-compose
  [examples]: https://github.com/simov/request-compose#examples
