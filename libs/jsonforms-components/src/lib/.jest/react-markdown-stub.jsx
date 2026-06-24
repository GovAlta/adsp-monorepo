// eslint-disable-next-line @typescript-eslint/no-var-requires
const React = require('react');

const ReactMarkdown = ({ children }) => React.createElement('div', { 'data-testid': 'react-markdown' }, children);
ReactMarkdown.displayName = 'ReactMarkdzown';
module.exports = ReactMarkdown;
module.exports.default = ReactMarkdown;