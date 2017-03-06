'use strict';

var PromiseInspection;

var PromiseInspection$1 = PromiseInspection = (function() {
  function PromiseInspection(arg) {
    this.state = arg.state, this.value = arg.value, this.reason = arg.reason;
  }

  PromiseInspection.prototype.isFulfilled = function() {
    return this.state === 'fulfilled';
  };

  PromiseInspection.prototype.isRejected = function() {
    return this.state === 'rejected';
  };

  return PromiseInspection;

})();

var _undefined$1 = void 0;

var _undefinedString$1 = 'undefined';

var soon;

soon = (function() {
  var bufferSize, callQueue, cqYield, fq, fqStart;
  fq = [];
  fqStart = 0;
  bufferSize = 1024;
  callQueue = function() {
    var err;
    while (fq.length - fqStart) {
      try {
        fq[fqStart]();
      } catch (error) {
        err = error;
        if (global.console) {
          global.console.error(err);
        }
      }
      fq[fqStart++] = _undefined$1;
      if (fqStart === bufferSize) {
        fq.splice(0, bufferSize);
        fqStart = 0;
      }
    }
  };
  cqYield = (function() {
    var dd, mo;
    if (typeof MutationObserver !== _undefinedString$1) {
      dd = document.createElement('div');
      mo = new MutationObserver(callQueue);
      mo.observe(dd, {
        attributes: true
      });
      return function() {
        dd.setAttribute('a', 0);
      };
    }
    if (typeof setImmediate !== _undefinedString$1) {
      return function() {
        setImmediate(callQueue);
      };
    }
    return function() {
      setTimeout(callQueue, 0);
    };
  })();
  return function(fn) {
    fq.push(fn);
    if (fq.length - fqStart === 1) {
      cqYield();
    }
  };
})();

var soon$1 = soon;

var Promise$1;
var STATE_FULFILLED;
var STATE_PENDING;
var STATE_REJECTED;
var _undefined;
var rejectClient;
var resolveClient;

_undefined = void 0;

STATE_PENDING = _undefined;

STATE_FULFILLED = 'fulfilled';

STATE_REJECTED = 'rejected';

resolveClient = function(c, arg) {
  var err, yret;
  if (typeof c.y === 'function') {
    try {
      yret = c.y.call(_undefined, arg);
      c.p.resolve(yret);
    } catch (error) {
      err = error;
      c.p.reject(err);
    }
  } else {
    c.p.resolve(arg);
  }
};

rejectClient = function(c, reason) {
  var err, yret;
  if (typeof c.n === 'function') {
    try {
      yret = c.n.call(_undefined, reason);
      c.p.resolve(yret);
    } catch (error) {
      err = error;
      c.p.reject(err);
    }
  } else {
    c.p.reject(reason);
  }
};

Promise$1 = (function() {
  function Promise(fn) {
    if (fn) {
      fn((function(_this) {
        return function(arg) {
          return _this.resolve(arg);
        };
      })(this), (function(_this) {
        return function(arg) {
          return _this.reject(arg);
        };
      })(this));
    }
  }

  Promise.prototype.resolve = function(value) {
    var clients, err, first, next;
    if (this.state !== STATE_PENDING) {
      return;
    }
    if (value === this) {
      return this.reject(new TypeError('Attempt to resolve promise with self'));
    }
    if (value && (typeof value === 'function' || typeof value === 'object')) {
      try {
        first = true;
        next = value.then;
        if (typeof next === 'function') {
          next.call(value, (function(_this) {
            return function(ra) {
              if (first) {
                if (first) {
                  first = false;
                }
                _this.resolve(ra);
              }
            };
          })(this), (function(_this) {
            return function(rr) {
              if (first) {
                first = false;
                _this.reject(rr);
              }
            };
          })(this));
          return;
        }
      } catch (error) {
        err = error;
        if (first) {
          this.reject(err);
        }
        return;
      }
    }
    this.state = STATE_FULFILLED;
    this.v = value;
    if (clients = this.c) {
      soon$1((function(_this) {
        return function() {
          var c, i, len;
          for (i = 0, len = clients.length; i < len; i++) {
            c = clients[i];
            resolveClient(c, value);
          }
        };
      })(this));
    }
  };

  Promise.prototype.reject = function(reason) {
    var clients;
    if (this.state !== STATE_PENDING) {
      return;
    }
    this.state = STATE_REJECTED;
    this.v = reason;
    if (clients = this.c) {
      soon$1(function() {
        var c, i, len;
        for (i = 0, len = clients.length; i < len; i++) {
          c = clients[i];
          rejectClient(c, reason);
        }
      });
    } else if (!Promise.suppressUncaughtRejectionError && global.console) {
      global.console.log('Broken Promise, please catch rejections: ', reason, reason ? reason.stack : null);
    }
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var a, client, p, s;
    p = new Promise;
    client = {
      y: onFulfilled,
      n: onRejected,
      p: p
    };
    if (this.state === STATE_PENDING) {
      if (this.c) {
        this.c.push(client);
      } else {
        this.c = [client];
      }
    } else {
      s = this.state;
      a = this.v;
      soon$1(function() {
        if (s === STATE_FULFILLED) {
          resolveClient(client, a);
        } else {
          rejectClient(client, a);
        }
      });
    }
    return p;
  };

  Promise.prototype["catch"] = function(cfn) {
    return this.then(null, cfn);
  };

  Promise.prototype["finally"] = function(cfn) {
    return this.then(cfn, cfn);
  };

  Promise.prototype.timeout = function(ms, msg) {
    msg = msg || 'timeout';
    return new Promise((function(_this) {
      return function(resolve, reject) {
        setTimeout(function() {
          return reject(Error(msg));
        }, ms);
        _this.then(function(val) {
          resolve(val);
        }, function(err) {
          reject(err);
        });
      };
    })(this));
  };

  Promise.prototype.callback = function(cb) {
    if (typeof cb === 'function') {
      this.then(function(val) {
        return cb(null, val);
      });
      this["catch"](function(err) {
        return cb(err, null);
      });
    }
    return this;
  };

  return Promise;

})();

var Promise$2 = Promise$1;

var resolve = function(val) {
  var z;
  z = new Promise$2;
  z.resolve(val);
  return z;
};

var reject = function(err) {
  var z;
  z = new Promise$2;
  z.reject(err);
  return z;
};

var all = function(ps) {
  var i, j, len, p, rc, resolvePromise, results, retP;
  results = [];
  rc = 0;
  retP = new Promise$2();
  resolvePromise = function(p, i) {
    if (!p || typeof p.then !== 'function') {
      p = resolve(p);
    }
    p.then(function(yv) {
      results[i] = yv;
      rc++;
      if (rc === ps.length) {
        retP.resolve(results);
      }
    }, function(nv) {
      retP.reject(nv);
    });
  };
  for (i = j = 0, len = ps.length; j < len; i = ++j) {
    p = ps[i];
    resolvePromise(p, i);
  }
  if (!ps.length) {
    retP.resolve(results);
  }
  return retP;
};

var reflect = function(promise) {
  return new Promise$2(function(resolve, reject) {
    return promise.then(function(value) {
      return resolve(new PromiseInspection$1({
        state: 'fulfilled',
        value: value
      }));
    })["catch"](function(err) {
      return resolve(new PromiseInspection$1({
        state: 'rejected',
        reason: err
      }));
    });
  });
};

var settle = function(promises) {
  return all(promises.map(reflect));
};

Promise$2.all = all;

Promise$2.reflect = reflect;

Promise$2.reject = reject;

Promise$2.resolve = resolve;

Promise$2.settle = settle;

Promise$2.soon = soon$1;

var getOwnPropertySymbols;
var hasOwnProperty;
var objectAssign;
var propIsEnumerable;
var shouldUseNative;
var toObject;
var slice = [].slice;

getOwnPropertySymbols = Object.getOwnPropertySymbols;

hasOwnProperty = Object.prototype.hasOwnProperty;

propIsEnumerable = Object.prototype.propertyIsEnumerable;

toObject = function(val) {
  if (val === null || val === void 0) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }
  return Object(val);
};

shouldUseNative = function() {
  var err, i, j, k, len, letter, order2, ref, test1, test2, test3;
  try {
    if (!Object.assign) {
      return false;
    }
    test1 = new String('abc');
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }
    test2 = {};
    for (i = j = 0; j <= 9; i = ++j) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    order2 = Object.getOwnPropertyNames(test2).map(function(n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }
    test3 = {};
    ref = 'abcdefghijklmnopqrst'.split('');
    for (k = 0, len = ref.length; k < len; k++) {
      letter = ref[k];
      test3[letter] = letter;
    }
    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }
    return true;
  } catch (error) {
    err = error;
    return false;
  }
};

var index$1 = objectAssign = (function() {
  if (shouldUseNative()) {
    return Object.assign;
  }
  return function() {
    var from, j, k, key, len, len1, ref, source, sources, symbol, target, to;
    target = arguments[0], sources = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    to = toObject(target);
    for (j = 0, len = sources.length; j < len; j++) {
      source = sources[j];
      from = Object(source);
      for (key in from) {
        if (hasOwnProperty.call(from, key)) {
          to[key] = from[key];
        }
      }
      if (getOwnPropertySymbols) {
        ref = getOwnPropertySymbols(from);
        for (k = 0, len1 = ref.length; k < len1; k++) {
          symbol = ref[k];
          if (propIsEnumerable.call(from, symbol)) {
            to[symbol] = from[symbol];
          }
        }
      }
    }
    return to;
  };
})();

var index_1 = index$1;

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

/*
 * Copyright 2015 Scott Brady
 * MIT License
 * https://github.com/scottbrady/xhr-promise/blob/master/LICENSE
 */
var XMLHttpRequestPromise;

/*
 * Module to wrap an XMLHttpRequest in a promise.
 */

var index = XMLHttpRequestPromise = (function() {
  function XMLHttpRequestPromise() {}

  XMLHttpRequestPromise.DEFAULT_CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=UTF-8';

  XMLHttpRequestPromise.Promise = Promise$2;


  /*
   * XMLHttpRequestPromise.send(options) -> Promise
   * - options (Object): URL, method, data, etc.
   *
   * Create the XHR object and wire up event handlers to use a promise.
   */

  XMLHttpRequestPromise.prototype.send = function(options) {
    var defaults;
    if (options == null) {
      options = {};
    }
    defaults = {
      method: 'GET',
      data: null,
      headers: {},
      async: true,
      username: null,
      password: null
    };
    options = index_1({}, defaults, options);
    return new Promise$2((function(_this) {
      return function(resolve, reject) {
        var e, header, ref, value, xhr;
        if (!XMLHttpRequest) {
          _this._handleError('browser', reject, null, "browser doesn't support XMLHttpRequest");
          return;
        }
        if (typeof options.url !== 'string' || options.url.length === 0) {
          _this._handleError('url', reject, null, 'URL is a required parameter');
          return;
        }
        _this._xhr = xhr = new XMLHttpRequest;
        xhr.onload = function() {
          var responseText;
          _this._detachWindowUnload();
          try {
            responseText = _this._getResponseText();
          } catch (error) {
            _this._handleError('parse', reject, null, 'invalid JSON response');
            return;
          }
          return resolve({
            url: _this._getResponseUrl(),
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: responseText,
            headers: _this._getHeaders(),
            xhr: xhr
          });
        };
        xhr.onerror = function() {
          return _this._handleError('error', reject);
        };
        xhr.ontimeout = function() {
          return _this._handleError('timeout', reject);
        };
        xhr.onabort = function() {
          return _this._handleError('abort', reject);
        };
        _this._attachWindowUnload();
        xhr.open(options.method, options.url, options.async, options.username, options.password);
        if ((options.data != null) && !options.headers['Content-Type']) {
          options.headers['Content-Type'] = _this.constructor.DEFAULT_CONTENT_TYPE;
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
          return _this._handleError('send', reject, null, e.toString());
        }
      };
    })(this));
  };


  /*
   * XMLHttpRequestPromise.getXHR() -> XMLHttpRequest
   */

  XMLHttpRequestPromise.prototype.getXHR = function() {
    return this._xhr;
  };


  /*
   * XMLHttpRequestPromise._attachWindowUnload()
   *
   * Fix for IE 9 and IE 10
   * Internet Explorer freezes when you close a webpage during an XHR request
   * https://support.microsoft.com/kb/2856746
   *
   */

  XMLHttpRequestPromise.prototype._attachWindowUnload = function() {
    this._unloadHandler = this._handleWindowUnload.bind(this);
    if (window.attachEvent) {
      return window.attachEvent('onunload', this._unloadHandler);
    }
  };


  /*
   * XMLHttpRequestPromise._detachWindowUnload()
   */

  XMLHttpRequestPromise.prototype._detachWindowUnload = function() {
    if (window.detachEvent) {
      return window.detachEvent('onunload', this._unloadHandler);
    }
  };


  /*
   * XMLHttpRequestPromise._getHeaders() -> Object
   */

  XMLHttpRequestPromise.prototype._getHeaders = function() {
    return parseHeaders$1(this._xhr.getAllResponseHeaders());
  };


  /*
   * XMLHttpRequestPromise._getResponseText() -> Mixed
   *
   * Parses response text JSON if present.
   */

  XMLHttpRequestPromise.prototype._getResponseText = function() {
    var responseText;
    responseText = typeof this._xhr.responseText === 'string' ? this._xhr.responseText : '';
    switch (this._xhr.getResponseHeader('Content-Type')) {
      case 'application/json':
      case 'text/javascript':
        responseText = JSON.parse(responseText + '');
    }
    return responseText;
  };


  /*
   * XMLHttpRequestPromise._getResponseUrl() -> String
   *
   * Actual response URL after following redirects.
   */

  XMLHttpRequestPromise.prototype._getResponseUrl = function() {
    if (this._xhr.responseURL != null) {
      return this._xhr.responseURL;
    }
    if (/^X-Request-URL:/m.test(this._xhr.getAllResponseHeaders())) {
      return this._xhr.getResponseHeader('X-Request-URL');
    }
    return '';
  };


  /*
   * XMLHttpRequestPromise._handleError(reason, reject, status, statusText)
   * - reason (String)
   * - reject (Function)
   * - status (String)
   * - statusText (String)
   */

  XMLHttpRequestPromise.prototype._handleError = function(reason, reject, status, statusText) {
    this._detachWindowUnload();
    return reject({
      reason: reason,
      status: status || this._xhr.status,
      statusText: statusText || this._xhr.statusText,
      xhr: this._xhr
    });
  };


  /*
   * XMLHttpRequestPromise._handleWindowUnload()
   */

  XMLHttpRequestPromise.prototype._handleWindowUnload = function() {
    return this._xhr.abort();
  };

  return XMLHttpRequestPromise;

})();

module.exports = index;
