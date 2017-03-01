# Promise polyfill
unless global.Promise?
  global.Promise = require('zousan')

module.exports = require('./')
