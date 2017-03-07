require 'shortcake'

use 'cake-test'
use 'cake-publish'
use 'cake-version'

task 'clean', 'clean project', ->
  exec 'rm -rf lib'

task 'build', 'build project', ->
  handroll = require 'handroll'

  bundle = yield handroll.bundle
    entry:    'src/index.coffee'
    commonjs: true

  # CommonJS
  bundle.write
    format:     'cjs'
    sourceMap: false

  # CommonJS
  bundle.write
    format:     'es'
    sourceMap: false
