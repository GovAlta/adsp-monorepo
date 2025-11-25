# @vercel/stega

A simple [steganography](https://en.wikipedia.org/wiki/Steganography) library for adding hidden JSON data to strings.

## Usage

This package exports a few methods for encoding and decoding data. All of these methods have TypeScript type definitions and JSDoc comments explaining their parameters and return values.

### `vercelStegaCombine(string, json, skip = 'auto')`

This method combines a `string` with some JSON data and returns the result. The `json` can be any value that can be JSON stringified.

When the `skip` property is `true`, the original string will be returned without combining the `json`. It supports `boolean` values and `'auto'`. The default is `'auto'`, which will only skip encoding when the `string` is an ISO date string or a URL.

```js
vercelStegaCombine('Hello world', { foo: 'bar' });
// -> 'Hello world' (the JSON data is hidden in the new string)
```

### `vercelStegaEncode(json)`

This method encodes JSON data as a hidden string and returns the result. The `json` can be any value that can be JSON stringified.

```js
vercelStegaEncode({ foo: 'bar' });
// -> '' (the JSON data is hidden)
```

### `vercelStegaSplit(string)`

This method splits out the original string (cleaned) and the encoded portion of the string.

```js
// In 'Hello world' (the extra data is hidden)
vercelStegaSplit('Hello world');
/*
 * -> {
 *  cleaned: 'Hello world', // This doesn't contain the encoded data
 *  encoded: '', // This is not an empty string, it contains the encoded data
 * }
 */
```

### `vercelStegaClean(json)`

This method strips all encoded stega data from the value and returns the cleaned value. It accepts any JSON value.

```js
// In 'Hello world' (the extra data is hidden)
vercelStegaClean('Hello world');
/*
 * -> 'Hello world' // This doesn't contain the encoded data
 */

// In 'Hello world' (the extra data is hidden)
vercelStegaClean({
  nested: {
    value: 'Hello world',
  },
});
/*
 * -> { nested: { value: 'Hello world' } } // This doesn't contain the encoded data
 */
```

### `vercelStegaDecode(string)`

This method attempts to extract encoded JSON data from a `string`.

```js
// In 'Hello world' (the extra data is hidden)
vercelStegaDecode('Hello world');
// -> { foo: 'bar' }
```
