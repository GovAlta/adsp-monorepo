// Dev server proxy configuration: proxy.conf.json, plus handling of the token handler's cookies.
const entries = require('./proxy.conf.json');

// The token handler sets its session cookie as Secure, which the deployed builder (https) needs. Safari does not
// store Secure cookies for http://localhost, so the Secure flag is removed for the local dev server.
const removeSecureFlag = (proxyRes) => {
  const cookies = proxyRes.headers['set-cookie'];
  if (cookies) {
    proxyRes.headers['set-cookie'] = cookies.map((cookie) => cookie.replace(/;\s*Secure/i, ''));
  }
};

module.exports = entries.map((entry) =>
  entry.context.some((context) => context.startsWith('/token-handler'))
    ? { ...entry, onProxyRes: removeSecureFlag, on: { proxyRes: removeSecureFlag } }
    : entry
);
