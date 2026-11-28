// clean-code-ignore: RULE-19 Jest setupFiles polyfill, not application code
// react-router-dom references TextEncoder/TextDecoder at module load time, which jsdom's
// test environment does not provide as globals (unlike Node's own global scope).
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
