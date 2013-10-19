
describe('Router', function () {

  var assert = require('assert');
  var history = require('history');
  var noop = function(){};
  var Router = require('router');
  var trigger = require('trigger-event');

  afterEach(function () {
    history.replace('/');
  });

  describe('#use', function () {
    it('should be pluggable', function (done) {
      var router = new Router();
      router.use(function (r) {
        assert(router === r);
        done();
      });
    });
  });

  describe('#context', function () {
    it('should return a context', function () {
      var router = new Router();
      var context = router.context();
      assert(context instanceof Router.Context);
    });

    it('should add the previous context', function () {
      var router = new Router();
      var previous = router.context();
      var context = router.context();
      assert(context.previous == previous);
    });
  });

  describe('#push', function () {
    it('should push path to history', function () {
      var router = new Router().push('/push');
      assert('/push' == history.path());
    });

    it('should push state to history', function () {
      var router = new Router().push('/push', { state: 'push' });
      assert('push' == history.state().state);
    });
  });

  describe('#replace', function () {
    it('should replace history', function () {
      var router = new Router().replace('/replace');
      assert('/replace' == history.path());
    });

    it('should replace state in history', function () {
      var router = new Router().replace('/replace', { state: 'replace' });
      assert('replace' == history.state().state);
    });
  });

  describe('#on', function () {
    it('should add callbacks', function () {
      var router = new Router().on('/route', noop, noop);
      assert(2 == router.middleware.fns.length);
    });
  });

  describe('#dispatch', function () {
    it('should match the right route', function (done) {
      var router = new Router()
        .on('/one', function (context, next) { assert(false); next(); })
        .on('/two', function (context, next) { done(); })
        .dispatch('/two');
    });

    it('should match params', function (done) {
      var router = new Router()
        .on('/route/:one/:two', function (context, next) {
          assert(2 == context.params.length);
          assert('1' == context.params[0]);
          assert('1' == context.params.one);
          assert('2' == context.params[1]);
          assert('2' == context.params.two);
          done();
        })
        .dispatch('/route/1/2');
    });

    it('should match asterisks', function (done) {
      var router = new Router()
        .on('/route/*/*', function (context, next) {
          assert(2 === context.params.length);
          assert('1' === context.params[0]);
          assert('2' === context.params[1]);
          done();
        })
        .dispatch('/route/1/2');
    });

    it('should match params and asterisks', function (done) {
      var router = new Router()
        .on('/route/:param/*', function (context, next) {
          assert(2 === context.params.length);
          assert('param' === context.params.param);
          assert('param' === context.params[0]);
          assert('asterisk' === context.params[1]);
          done();
        })
        .dispatch('/route/param/asterisk');
    });

    it('should pass a next callback', function (done) {
      var router = new Router()
        .on('/route', function (context, next) { next(); })
        .on('/route', function (context, next) { done(); })
        .dispatch('/route');
    });

    it('should auto-next callbacks with single arity', function (done) {
      var router = new Router()
        .on('/route', noop, function (context, next) { done(); })
        .dispatch('/route');
    });
  });

  describe('#go', function () {
    it('should push and dispatch a path', function (done) {
      var router = new Router()
        .on('/route', function (context, next) {
          assert('/route' == history.path());
          assert('state' == history.state().state);
          done();
        })
        .go('/route', { state: 'state' });
    });

    it('should default to the current path', function (done) {
      var router = new Router()
        .replace('/something')
        .on('/something', function (context, next) { done(); })
        .go();
    });
  });

  describe('#start', function () {
    it('should be an alias for #go', function () {
      assert(Router.prototype.start == Router.prototype.go);
    });
  });

  describe('#listen', function () {
    it('should go and listen clicks', function (done) {
      var i = 0;
      var router = new Router()
        .push('/start')
        .on('/start', function (context, next) { i++; })
        .on('/link', function (context, next) {
          assert(1 == i);
          done();
        })
        .listen();
      trigger(document.getElementById('link'), 'click');
    });
  });

});