
var bind = require('event').bind;
var Context = require('./context');
var history = require('history');
var link = require('link-delegate');
var prevent = require('prevent');
var Route = require('./route');
var stop = require('stop');
var url = require('url');
var Ware = require('ware');


/**
 * Expose `Router`.
 */

module.exports = exports = Router;


/**
 * Expose `Route`.
 */

exports.Route = Route;


/**
 * Expose `Context`.
 */

exports.Context = Context;

/**
 * List of routers
 */

var routers = [];

/**
 * Initialize a new `Router`.
 */

function Router () {
  if (!(this instanceof Router)) return new Router();
  routers.push(this);
  this.middleware = new Ware();
  this.running = false;
  this.bind();
}


/**
 * Use the given `plugin`.
 *
 * @param {Function} plugin
 * @return {Router}
 */

Router.prototype.use = function (plugin) {
  plugin(this);
  return this;
};


/**
 * Attach a route handler.
 *
 * @param {String} path
 * @return {Router}
 */

Router.prototype.on = function (path) {
  var route = new Route(path, this);
  // var fns = Array.prototype.slice.call(arguments, 1);
  // for (var i = 1; i < arguments.length; i++) {
  //   this.middleware.use(route.middleware(arguments[i]));
  // }
  return this;
};


/**
 * Trigger a route at `path`.
 *
 * @param {String} path
 * @return {Router}
 */

Router.prototype.dispatch = function (path) {
  var context = this.context(path);
  this.middleware.run(context);
  return this;
};


/**
 * Dispatch a new `path` and push it to the history, or use the current path.
 *
 * @param {String} path (optional)
 * @param {Object} state (optional)
 * @return {Router}
 */

Router.prototype.start = function () {
  path = location.pathname + location.search;
  this.dispatch(path);
  return this;
};


/**
 * Start the router and listen for link clicks relative to an optional `path`.
 * You can optionally set `start` to false to manage the first dispatch yourself.
 *
 * @param {String} path
 * @param {Boolean} start
 * @return {Router}
 */

Router.prototype.listen = function (path, start) {
  if ('boolean' == typeof path) {
    start = path;
    path = null;
  }

  if (start || start === undefined) this.start();

  var self = this;
  link(function (e) {
    var el = e.target;
    var href = el.href;
    if (!el.hasAttribute('href') || !routable(href, path)) return;
    var parsed = url.parse(href);
    self.go(parsed.pathname);
    prevent(e);
    stop(e);
  });

  return this;
};

/**
 * Go to a new `path`
 *
 * @param {String} path
 * @param {Object} state (optional)
 */

Router.go = function(path, state) {
  if (!path) return;
  Router.push(path, state);

  for (var i = 0, len = routers.length; i < len; i++) {
    routers[i].dispatch(path);
  };
};

/**
 * Push a new `path` to the browsers history.
 *
 * @param {String} path
 * @param {Object} state (optional)
 * @return {Router}
 */

Router.push = function (path, state) {
  history.push(path, state);
  return this;
};


/**
 * Replace the current path in the browsers history.
 *
 * @param {String} path
 * @param {Object} state (optional)
 * @return {Router}
 */

Router.replace = function (path, state) {
  history.replace(path, state);
  return this;
};


/**
 * Bind to `popstate` so that the router follow back events. Bind after the
 * document has loaded, and after an additional tick because some browsers
 * trigger a `popstate` event when the page first loads.
 *
 * @api private
 */

Router.prototype.bind = function () {
  var self = this;
  setTimeout(function () {
    bind(window, 'popstate', function (e) {
      self.go();
    });
  }, 1000);
};


/**
 * Generate a new context object for a given `path`.
 *
 * @param {String} path
 * @return {Context}
 * @api private
 */

Router.prototype.context = function (path) {
  var previous = this._context || {};
  var context = this._context = new Context(path);
  context.previous = previous;
  return context;
};


/**
 * Check if a given `href` is routable under `path`.
 *
 * @param {String} href
 * @return {Boolean}
 */

function routable (href, path) {
  if (!path) return true;
  var parsed = url.parse(href);
  if (parsed.pathname.indexOf(path) === 0) return true;
  return false;
}
