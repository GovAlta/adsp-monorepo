const React = require('react');
// Minimal stub: renders children as plain text so MarkdownComponent tests can assert on content
const ReactMarkdown = ({ children }) => React.createElement('div', { 'data-testid': 'react-markdown' }, children);
ReactMarkdown.displayName = 'ReactMarkdown';
module.exports = ReactMarkdown;
module.exports.default = ReactMarkdown;
