// eslint-disable-next-line no-undef
module.exports = {
  process: content => ({ code: "module.exports.default = " + JSON.stringify(content) })
};
