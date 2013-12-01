/**
 * Module Dependencies
 */

var slice = [].slice;
var regexp = require('path-to-regexp');

/**
 * Expose `Route`.
 */

module.exports = Route;

/**
 * Previous route
 */

var previous = null;

/**
 * Initialize a new `Route` with the given `path`.
 *
 * @param {String} path
 * @param {Router} router (private)
 * @return {Route}
 */

function Route (path, router) {
  this.path = path;
  this.keys = [];
  this.regexp = regexp(path, this.keys);
  this.router = router;
  this.ins = [];
  this.outs = [];
}

/**
 * Call when we go to a path
 */

Route.prototype.in = function() {
  var router = this.router;
  var fns = slice.call(arguments);

  for (var i = 0, len = fns.length; i < len; i++) {
    router.middleware.use(fns[i]);
  }

  this.ins = this.ins.concat(fns);
  return this;
};

/**
 * Call when we leave a path
 */

Route.prototype.out = function() {
  var fns = slice.call(arguments);
  this.outs = this.outs.concat(fns);
  return this;
}

/**
 * Return route middleware with the given `fn`.
 *
 * @param {Function} fn
 * @return {Function}
 */

Route.prototype.middleware = function (fn) {
  var self = this;
  var match = function (context) {
    return self.match(context.path, context.params);
  };

  switch (fn.length) {
    case 3: return error;
    case 2: return async;
    default: return sync;
  }

  function error(err, ctx, next) {
    if (match(ctx)) {
      fn(err, ctx, next);
    } else {
      next();
    }
  }

  function async(ctx, next) {
    if (match(ctx)) {
      fn(ctx, next)
    } else {
      next();
    }
  }

  function sync(ctx, next) {
    if (match(ctx)) fn(ctx);
    next();
  }

  function out() {
    if (previous) {
      for (var i = 0, len = previous.outs.length; i < len; i++) {
        previous.outs[i]
      };
    }

    previous = {
      outs: route.outs,
      ctx: ctx
    };
  }
};


/**
 * Check if the route matches a given `path`, returning false or an object.
 *
 * @param {String} path
 * @return {Boolean|Object}
 */

Route.prototype.match = function (path, params) {
  var keys = this.keys;
  var pathname = path.split('?')[0];
  var m = this.regexp.exec(pathname);
  if (!m) return false;

  for (var i = 1, len = m.length; i < len; ++i) {
    var key = keys[i - 1];
    var val = 'string' == typeof m[i] ? decodeURIComponent(m[i]) : m[i];
    if (key) params[key.name] = val;
    params.push(val);
  }

  return true;
};
