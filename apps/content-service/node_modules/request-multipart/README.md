
# request-multipart

[![npm-version]][npm] [![travis-ci]][travis] [![coveralls-status]][coveralls]

> _Multipart body support for **[request-compose]**_

```js
var request = require('request-compose').extend({
  Request: {multipart: require('request-multipart')}
}).client

;(async () => {
  try {
    var {res, body} = await request({
      method: 'POST',
      url: 'https://slack.com/api/files.upload',
      headers: {
        authorization: 'Bearer [ACCESS TOKEN]'
      },
      multipart: {
        file: require('fs').createReadStream('cat.png')
      }
    })
    console.log(body)
  }
  catch (err) {
    console.error(err)
  }
})()
```

# multipart/form-data

```js
multipart: {
  key: 'value' // String, Buffer or Stream
}
```

```js
multipart: {
  status: 'Hello',
  'media[]': fs.createReadStream('cat.png')
}
```

```
--88b7fcd3-7776-4087-8b09-5b0f5c8af069
Content-Disposition: form-data; name="status"
Content-Type: text/plain

Hello

--88b7fcd3-7776-4087-8b09-5b0f5c8af069
Content-Disposition: form-data; name="media[]"; filename="cat.png"
Content-Type: image/png

...stream...
```

### Options

> Most servers expect the `filename` key to be set inside the `Content-Disposition` and a correct MIME type to be specified as `Content-Type`. When reading a file as `Buffer` request-multipart cannot determine those values.

```js
multipart: {
  key: {
    body: 'value', // String, Buffer or Stream
    options: {name: '', type: '', length: 0}
  }
}
```

```js
multipart: {
  file: {
    body: fs.readFileSync('cat.png'),
    options: {name: 'cat.png', type: 'image/png'}
  }
}
```

```
--77f9de0f-8905-4b63-9ca9-ad1ff9827053
Content-Disposition: form-data; name="file"; filename="cat.png"
Content-Type: image/png

...buffer...
```

### List

```js
multipart: {
  key: [
    'value', // String, Buffer or Stream
    'value', // String, Buffer or Stream
  ]
}
```

```js
multipart: {
  attachment: [
    fs.createReadStream('cat.png'),
    fs.createReadStream('beep.mp3')
  ]
}
```

```
--21cd47c7-379b-43f3-8e5e-d95c36653abf
Content-Disposition: form-data; name="attachment"; filename="cat.png"
Content-Type: image/png

...stream...

--21cd47c7-379b-43f3-8e5e-d95c36653abf
Content-Disposition: form-data; name="attachment"; filename="beep.mp3"
Content-Type: audio/mpeg

...stream...
```

# multipart/related

```js
multipart: [
  {
    key: 'value',
    body: 'value' // String, Buffer or Stream
  },
  {
    key: 'value',
    body: 'value' // String, Buffer or Stream
  }
]
```

```js
multipart: [
  {
    'Content-Type': 'application/json',
    body: JSON.stringify({name: 'cat.png'})
  },
  {
    'Content-Type': 'image/png',
    body: fs.createReadStream('cat.png')
  }
]
```

```
--f3386c29-f73f-423f-b80e-9dac2801893b
Content-Type: application/json

{"name":"cat.png"}

--f3386c29-f73f-423f-b80e-9dac2801893b
Content-Type: image/png

...stream...
```

# [examples]

```bash
DEBUG=req,res,body,json node examples/multipart.js slack
```

  [npm-version]: https://img.shields.io/npm/v/request-multipart.svg?style=flat-square (NPM Package Version)
  [travis-ci]: https://img.shields.io/travis/simov/request-multipart/master.svg?style=flat-square (Build Status - Travis CI)
  [coveralls-status]: https://img.shields.io/coveralls/simov/request-multipart.svg?style=flat-square (Test Coverage - Coveralls)

  [npm]: https://www.npmjs.com/package/request-multipart
  [travis]: https://travis-ci.org/simov/request-multipart
  [coveralls]: https://coveralls.io/github/simov/request-multipart

  [request-compose]: https://www.npmjs.com/package/request-compose
  [examples]: https://github.com/simov/request-multipart/blob/master/examples/multipart.js
