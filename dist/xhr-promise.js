'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Promise = _interopDefault(require('broken'));
var objectAssign = _interopDefault(require('es-object-assign'));

// src/parse-headers.coffee
var isArray;
var parseHeaders;
var trim;

trim = function(s) {
  return s.replace(/^\s*|\s*$/g, '');
};

isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

var parseHeaders$1 = parseHeaders = function(headers) {
  var i, index, key, len, ref, result, row, value;
  if (!headers) {
    return {};
  }
  result = {};
  ref = trim(headers).split('\n');
  for (i = 0, len = ref.length; i < len; i++) {
    row = ref[i];
    index = row.indexOf(':');
    key = trim(row.slice(0, index)).toLowerCase();
    value = trim(row.slice(index + 1));
    if (typeof result[key] === 'undefined') {
      result[key] = value;
    } else if (isArray(result[key])) {
      result[key].push(value);
    } else {
      result[key] = [result[key], value];
    }
    return;
  }
  return result;
};

// src/index.coffee

/*
 * Copyright 2015 Scott Brady
 * MIT License
 * https://github.com/scottbrady/xhr-promise/blob/master/LICENSE
 */
var XhrPromise;
var defaults;

defaults = {
  method: 'GET',
  headers: {},
  data: null,
  username: null,
  password: null,
  async: true
};


/*
 * Module to wrap an XhrPromise in a promise.
 */

XhrPromise = (function() {
  class XhrPromise {

    /*
     * XhrPromise.send(options) -> Promise
     * - options (Object): URL, method, data, etc.
     *
     * Create the XHR object and wire up event handlers to use a promise.
     */

    send(options = {}) {
      options = objectAssign({}, defaults, options);
      return new Promise((resolve, reject) => {
        var e, header, ref, value, xhr;
        if (!XhrPromise) {
          this._handleError('browser', reject, null, "browser doesn't support XhrPromise");
          return;
        }
        if (typeof options.url !== 'string' || options.url.length === 0) {
          this._handleError('url', reject, null, 'URL is a required parameter');
          return;
        }
        this._xhr = xhr = new XhrPromise;
        xhr.onload = () => {
          var responseText;
          this._detachWindowUnload();
          try {
            responseText = this._getResponseText();
          } catch (error) {
            this._handleError('parse', reject, null, 'invalid JSON response');
            return;
          }
          return resolve({
            url: this._getResponseUrl(),
            headers: this._getHeaders(),
            responseText: responseText,
            status: xhr.status,
            statusText: xhr.statusText,
            xhr: xhr
          });
        };
        xhr.onerror = () => {
          return this._handleError('error', reject);
        };
        xhr.ontimeout = () => {
          return this._handleError('timeout', reject);
        };
        xhr.onabort = () => {
          return this._handleError('abort', reject);
        };
        this._attachWindowUnload();
        xhr.open(options.method, options.url, options.async, options.username, options.password);
        if ((options.data != null) && !options.headers['Content-Type']) {
          options.headers['Content-Type'] = this.constructor.DEFAULT_CONTENT_TYPE;
        }
        ref = options.headers;
        for (header in ref) {
          value = ref[header];
          xhr.setRequestHeader(header, value);
        }
        try {
          return xhr.send(options.data);
        } catch (error) {
          e = error;
          return this._handleError('send', reject, null, e.toString());
        }
      });
    }


    /*
     * XhrPromisePromise.getXHR() -> XhrPromise
     */

    getXHR() {
      return this._xhr;
    }


    /*
     * XhrPromisePromise._attachWindowUnload()
     *
     * Fix for IE 9 and IE 10
     * Internet Explorer freezes when you close a webpage during an XHR request
     * https://support.microsoft.com/kb/2856746
     *
     */

    _attachWindowUnload() {
      this._unloadHandler = this._handleWindowUnload.bind(this);
      if (window.attachEvent) {
        return window.attachEvent('onunload', this._unloadHandler);
      }
    }


    /*
     * XhrPromisePromise._detachWindowUnload()
     */

    _detachWindowUnload() {
      if (window.detachEvent) {
        return window.detachEvent('onunload', this._unloadHandler);
      }
    }


    /*
     * XhrPromisePromise._getHeaders() -> Object
     */

    _getHeaders() {
      return parseHeaders$1(this._xhr.getAllResponseHeaders());
    }


    /*
     * XhrPromisePromise._getResponseText() -> Mixed
     *
     * Parses response text JSON if present.
     */

    _getResponseText() {
      var responseText;
      responseText = typeof this._xhr.responseText === 'string' ? this._xhr.responseText : '';
      switch (this._xhr.getResponseHeader('Content-Type')) {
        case 'application/json':
        case 'text/javascript':
          responseText = JSON.parse(responseText + '');
      }
      return responseText;
    }


    /*
     * XhrPromisePromise._getResponseUrl() -> String
     *
     * Actual response URL after following redirects.
     */

    _getResponseUrl() {
      if (this._xhr.responseURL != null) {
        return this._xhr.responseURL;
      }
      if (/^X-Request-URL:/m.test(this._xhr.getAllResponseHeaders())) {
        return this._xhr.getResponseHeader('X-Request-URL');
      }
      return '';
    }


    /*
     * XhrPromisePromise._handleError(reason, reject, status, statusText)
     * - reason (String)
     * - reject (Function)
     * - status (String)
     * - statusText (String)
     */

    _handleError(reason, reject, status, statusText) {
      this._detachWindowUnload();
      return reject({
        reason: reason,
        status: status || this._xhr.status,
        statusText: statusText || this._xhr.statusText,
        xhr: this._xhr
      });
    }


    /*
     * XhrPromisePromise._handleWindowUnload()
     */

    _handleWindowUnload() {
      return this._xhr.abort();
    }

  }

  XhrPromise.DEFAULT_CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=UTF-8';

  XhrPromise.Promise = Promise;

  return XhrPromise;

})();

var XhrPromise$1 = XhrPromise;

module.exports = XhrPromise$1;
//# sourceMappingURL=xhr-promise.js.map
