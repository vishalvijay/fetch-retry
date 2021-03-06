'use strict';
var fetchBuilder = require('../../');
var sinon = require('sinon');
var expect = require('expectations');
var Promise = require('es6-promise');

describe('fetchBuilder', function () {

  it('should accept fetch function as argument', function () {
    expect(function () {
      fetchBuilder();
    }).toThrow({
      name: 'ArgumentError',
      message: 'fetch must be a function'
    });
  });

  it('should return fetchRetry function', function () {
    expect(typeof fetchBuilder(function () { })).toBe('function');
  });
});

describe('fetch-retry', function () {

  var fetch;
  var fetchRetry;

  var deferred1;
  var deferred2;
  var deferred3;
  var deferred4;

  var thenCallback;
  var catchCallback;

  var clock;
  var delay;

  beforeEach(function () {
    delay = 1000;
    clock = sinon.useFakeTimers();
  });

  afterEach(function () {
    clock.restore();
  });

  beforeEach(function () {
    deferred1 = defer();
    deferred2 = defer();
    deferred3 = defer();
    deferred4 = defer();

    fetch = sinon.stub();
    fetch.onCall(0).returns(deferred1.promise);
    fetch.onCall(1).returns(deferred2.promise);
    fetch.onCall(2).returns(deferred3.promise);
    fetch.onCall(3).returns(deferred4.promise);

    fetchRetry = fetchBuilder(fetch);
  });

  describe('#url', function () {

    var expectedUrl = 'http://some-url.com';

    beforeEach(function () {
      fetchRetry(expectedUrl);
    });

    it('passes #url to fetch', function () {
      expect(fetch.getCall(0).args[0]).toBe(expectedUrl);
    });

  });

  describe('#options', function () {

    describe('when #options is provided', function () {

      var options;

      beforeEach(function () {
        options = {
          retries: 3,
          whatever: 'something'
        };

        fetchRetry('http://someUrl', options);
      });

      it('passes options to fetch', function () {
        expect(fetch.getCall(0).args[1]).toEqual(options);
      });

      describe('when #options.retryOn is not an array or function', () => {

        it('throws exception', () => {
          expect(function () {
            options.retryOn = 503;
            fetchRetry('http://someUrl', options);
          }).toThrow({
            name: 'ArgumentError',
            message: 'retryOn property expects an array or function'
          });
        });

      });

    });

    describe('when #options is undefined or null', function () {

      [undefined, null].forEach(function (testCase) {

        beforeEach(function () {
          fetchRetry('http://someUrl', testCase);
        });

        it('does not pass through options to fetch', function () {
          expect(fetch.getCall(0).args[1]).toEqual(undefined);
        });

      });

    });

  });

  describe('#options.retries', function () {

    describe('when #options.retries=3 (default)', function () {

      beforeEach(function () {
        thenCallback = sinon.spy();
        catchCallback = sinon.spy();

        fetchRetry('http://someurl')
          .then(thenCallback)
          .catch(catchCallback);
      });

      describe('when first call is a success', function () {

        beforeEach(function () {
          deferred1.resolve({ status: 200 });
        });

        describe('when resolved', function () {

          it('invokes the then callback', function () {
            expect(thenCallback.called).toBe(true);
          });

          it('calls fetch once', function () {
            expect(fetch.callCount).toBe(1);
          });

        });

      });

      describe('when first call is a failure', function () {

        beforeEach(function () {
          deferred1.reject();
        });

        describe('when second call is a success', function () {

          beforeEach(function () {
            clock.tick(delay);
            deferred2.resolve({ status: 200 });
          });

          describe('when resolved', function () {

            it('invokes the then callback', function () {
              expect(thenCallback.called).toBe(true);
            });

            it('calls fetch twice', function () {
              expect(fetch.callCount).toBe(2);
            });

          });

        });

        describe('when second call is a failure', function () {

          beforeEach(function () {
            deferred2.reject();
            clock.tick(delay);
          });

          describe('when third call is a success', function () {

            beforeEach(function () {
              deferred3.resolve({ status: 200 });
              clock.tick(delay);
            });

            describe('when resolved', function () {

              it('invokes the then callback', function () {
                expect(thenCallback.called).toBe(true);
              });

              it('calls fetch three times', function () {
                expect(fetch.callCount).toBe(3);
              });

            });

          });

          describe('when third call is a failure', function () {

            beforeEach(function () {
              deferred3.reject();
              clock.tick(delay);
            });

            describe('when fourth call is a success', function () {

              beforeEach(function () {
                deferred4.resolve({ status: 200 });
                clock.tick(delay);
              });

              describe('when resolved', function () {

                it('invokes the then callback', function () {
                  expect(thenCallback.called).toBe(true);
                });

                it('calls fetch four times', function () {
                  expect(fetch.callCount).toBe(4);
                });

              });

            });

            describe('when fourth call is a failure', function () {

              beforeEach(function () {
                deferred4.reject();
                clock.tick(delay);
              });

              describe('when rejected', function () {

                it('invokes the catch callback', function () {
                  expect(catchCallback.called).toBe(true);
                });

                it('does not call fetch again', function () {
                  expect(fetch.callCount).toBe(4);
                });

              });

            });

          });

        });

      });

    });

    describe('when #options.retries=1', function () {

      beforeEach(function () {
        thenCallback = sinon.spy();
        catchCallback = sinon.spy();

        fetchRetry('http://someurl', { retries: 1 })
          .then(thenCallback)
          .catch(catchCallback);
      });

      describe('when first call is a success', function () {

        beforeEach(function () {
          deferred1.resolve({ status: 200 });
        });

        describe('when resolved', function () {

          it('invokes the then callback', function () {
            expect(thenCallback.called).toBe(true);
          });

          it('calls fetch once', function () {
            expect(fetch.callCount).toBe(1);
          });

        });

      });

      describe('when first call is a failure', function () {

        beforeEach(function () {
          deferred1.reject();
          clock.tick(delay);
        });

        describe('when second call is a success', function () {

          beforeEach(function () {
            deferred2.resolve({ status: 200 });
            clock.tick(delay);
          });

          describe('when resolved', function () {

            it('invokes the then callback', function () {
              expect(thenCallback.called).toBe(true);
            });

            it('calls fetch twice', function () {
              expect(fetch.callCount).toBe(2);
            });

          });

        });

        describe('when second call is a failure', function () {

          beforeEach(function () {
            deferred2.reject();
            clock.tick(delay);
          });

          describe('when rejected', function () {

            it('invokes the catch callback', function () {
              expect(catchCallback.called).toBe(true);
            });

            it('does not call fetch again', function () {
              expect(fetch.callCount).toBe(2);
            });

          });

        });

      });

    });

    describe('when #options.retries=0', function () {

      beforeEach(function () {
        thenCallback = sinon.spy();
        catchCallback = sinon.spy();

        fetchRetry('http://someurl', { retries: 0 })
          .then(thenCallback)
          .catch(catchCallback);
      });

      describe('when first call is a success', function () {

        beforeEach(function () {
          deferred1.resolve({ status: 200 });
        });

        describe('when resolved', function () {

          it('invokes the then callback', function () {
            expect(thenCallback.called).toBe(true);
          });

          it('calls fetch once', function () {
            expect(fetch.callCount).toBe(1);
          });

        });

      });

      describe('when first call is a failure', function () {

        beforeEach(function () {
          deferred1.reject();
        });

        describe('when rejected', () => {

          it('invokes the catch callback', function () {
            expect(catchCallback.called).toBe(true);
          });

        });

      });

    });

    describe('when #options.retries is not a a positive integer', () => {

      ['1', -1, 'not a number', null].forEach(invalidRetries => {

        it('throws error', () => {
          const expectedError = {
            name: 'ArgumentError',
            message: 'retries must be a positive integer'
          };
          expect(() => {
            fetchRetry('http://someurl', { retries: invalidRetries });
          }).toThrow(expectedError);
        });

      });

    });

  });

  describe('#options.retryDelay', function () {

    describe('when #options.retryDelay is a number', function () {

      var options;
      var retryDelay;

      beforeEach(function () {
        retryDelay = 5000;
        options = {
          retryDelay: retryDelay
        };

        thenCallback = sinon.spy();

        fetchRetry('http://someUrl', options)
          .then(thenCallback);
      });

      describe('when first call is unsuccessful', function () {

        beforeEach(function () {
          deferred1.reject();
        });

        describe('after specified time', function () {

          beforeEach(function () {
            clock.tick(retryDelay);
          });

          it('invokes fetch again', function () {
            expect(fetch.callCount).toBe(2);
          });

        });

        describe('after less than specified time', function () {

          beforeEach(function () {
            clock.tick(1000);
          });

          it('does not invoke fetch again', function () {
            expect(fetch.callCount).toBe(1);
          });

        });

      });

    });

    describe('when #options.retryDelay is 0', function () {

      var options;
      var retryDelay;

      beforeEach(function () {
        retryDelay = 0;
        options = {
          retryDelay: retryDelay
        };

        thenCallback = sinon.spy();

        fetchRetry('http://someUrl', options)
          .then(thenCallback);
      });

      describe('when first call is unsuccessful', function () {

        beforeEach(function () {
          deferred1.reject();
        });

        describe('after one event loop tick', function () {

          beforeEach(function () {
            clock.tick(0);
          });

          it('invokes fetch again', function () {
            expect(fetch.callCount).toBe(2);
          });

        });

      });

    });

    describe('when #options.retryDelay is not a a positive integer', () => {

      ['1', -1, 'not a number', null].forEach(invalidDelay => {

        it('throws error', () => {
          const expectedError = {
            name: 'ArgumentError',
            message: 'retryDelay must be a positive integer or a function returning a positive integer'
          };
          expect(() => {
            fetchRetry('http://someurl', { retryDelay: invalidDelay });
          }).toThrow(expectedError);
        });

      });

    });

    describe('when #options.retryDelay is a function', function () {

      var options;
      var retryDelay;

      beforeEach(function () {
        retryDelay = sinon.stub().returns(5000);
        options = {
          retryDelay: retryDelay
        };

        thenCallback = sinon.spy();

        fetchRetry('http://someUrl', options)
          .then(thenCallback);
      });

      describe('when first call is unsuccessful', function () {

        beforeEach(function () {
          deferred1.reject(new Error('first error'));
        });

        describe('when the second call is a success', function () {

          beforeEach(function () {
            deferred2.resolve({ status: 200 });
            clock.tick(5000);
          });

          it('invokes the retryDelay function', function () {
            expect(retryDelay.called).toBe(true);
            expect(retryDelay.lastCall.args[0]).toEqual(0);
            expect(retryDelay.lastCall.args[1].message).toEqual('first error');
          });


        });

        describe('when second call is a failure', function () {

          beforeEach(function () {
            deferred2.reject(new Error('second error'));
            clock.tick(5000);
          });

          describe('when the third call is a success', function () {

            beforeEach(function () {
              deferred3.resolve({ status: 200 });
              clock.tick(5000);
            });

            it('invokes the retryDelay function again', function () {
              expect(retryDelay.callCount).toBe(2);
              expect(retryDelay.lastCall.args[0]).toEqual(1);
              expect(retryDelay.lastCall.args[1].message).toEqual('second error');
            });

          });

        });

      });

    });

  });

  describe('#options.retryOn', () => {

    describe('when #options.retryOn is an array', () => {

      var options;
      var retryOn;

      beforeEach(function () {
        retryOn = [503, 404];
        options = {
          retryOn: retryOn
        };

        thenCallback = sinon.spy();
        catchCallback = sinon.spy();

        fetchRetry('http://someUrl', options)
          .then(thenCallback)
          .catch((catchCallback));
      });

      describe('when first fetch is resolved with status code specified in retryOn array', () => {

        beforeEach(() => {
          deferred1.resolve({ status: 503 });
        });

        describe('after specified delay', () => {

          beforeEach(() => {
            clock.tick(delay);
          });

          it('retries fetch', () => {
            expect(fetch.callCount).toBe(2);
          });

          describe('when second fetch resolves with a different status code', () => {

            beforeEach(() => {
              deferred2.resolve({ status: 200 });
            });

            describe('when resolved', () => {

              it('invokes the then callback', function () {
                expect(thenCallback.called).toBe(true);
              });

              it('has called fetch twice', function () {
                expect(fetch.callCount).toBe(2);
              });

            });

          });

        });

      });

    });

    describe('when #options.retryOn is a function', function () {

      var options;
      var retryOn;

      beforeEach(function () {
        retryOn = sinon.stub();
        options = {
          retryOn: retryOn
        };

        thenCallback = sinon.spy();
        catchCallback = sinon.spy();

        fetchRetry('http://someUrl', options)
          .then(thenCallback)
          .catch((catchCallback));
      });

      describe('when first attempt is rejected due to network error', function () {

        describe('when #retryOn() returns true', () => {

          beforeEach(function () {
            retryOn.returns(true);
            deferred1.reject(new Error('first error'));
          });

          describe('when rejected', function () {

            it('invokes #retryOn function with an error', function () {
              expect(retryOn.called).toBe(true);
              expect(retryOn.lastCall.args.length).toBe(3);
              expect(retryOn.lastCall.args[0]).toBe(0);
              expect(retryOn.lastCall.args[1] instanceof Error).toBe(true);
              expect(retryOn.lastCall.args[2]).toBe(null);
            });

            describe('after specified time', function () {

              beforeEach(function () {
                clock.tick(delay);
              });

              it('invokes fetch again', function () {
                expect(fetch.callCount).toBe(2);
              });

              describe('when the second call is unsuccessful', function () {

                beforeEach(function () {
                  deferred2.reject(new Error('second error'));
                  clock.tick(delay);
                });

                describe('when rejected', function () {

                  it('invokes the #retryOn function twice', function () {
                    expect(retryOn.callCount).toBe(2);
                    expect(retryOn.lastCall.args[0]).toBe(1);
                  });

                });

              });

            });

          });

        });

        describe('when #retryOn() returns false', () => {

          beforeEach(function () {
            retryOn.returns(false);
            deferred1.reject(new Error('first error'));
          });

          describe('when rejected', function () {

            it('invokes #retryOn function with an error', function () {
              expect(retryOn.called).toBe(true);
              expect(retryOn.lastCall.args.length).toBe(3);
              expect(retryOn.lastCall.args[0]).toBe(0);
              expect(retryOn.lastCall.args[1] instanceof Error).toBe(true);
              expect(retryOn.lastCall.args[2]).toBe(null);
            });

            describe('after specified time', function () {

              beforeEach(function () {
                clock.tick(delay);
              });

              it('invokes the catch callback', function () {
                expect(catchCallback.called).toBe(true);
              });

              it('does not call fetch again', function () {
                expect(fetch.callCount).toBe(1);
              });

            });

          });

        });

      });

      describe('when first attempt is resolved', function () {

        describe('when #retryOn() returns true', () => {

          beforeEach(function () {
            retryOn.returns(true);
            deferred1.resolve({ status: 200 });
          });

          describe('after specified delay', () => {

            beforeEach(function () {
              clock.tick(delay);
            });

            it('calls fetch again', function () {
              expect(fetch.callCount).toBe(2);
            });

            describe('when second call is resolved', () => {

              beforeEach(function () {
                deferred2.resolve({ status: 200 });
                clock.tick(delay);
              });

              it('invokes the #retryOn function with the response', function () {
                expect(retryOn.called).toBe(true);
                expect(retryOn.lastCall.args.length).toBe(3);
                expect(retryOn.lastCall.args[0]).toBe(0);
                expect(retryOn.lastCall.args[1]).toBe(null);
                expect(retryOn.lastCall.args[2]).toEqual({ status: 200 });
              });

            });

          });

        });

        describe('when #retryOn() returns false', () => {

          beforeEach(function () {
            retryOn.returns(false);
            deferred1.resolve({ status: 502 });
          });

          describe('when resolved', () => {

            it('invokes the then callback', function () {
              expect(thenCallback.called).toBe(true);
            });

            it('calls fetch 1 time only', function () {
              expect(fetch.callCount).toBe(1);
            });

          });

        });

      });

    });

    describe('when #options.retryOn is not an array or function', function () {

      var options;

      describe('when #options.retryOn is not an array or function', () => {

        it('throws exception', () => {
          expect(function () {
            options.retryOn = 503;
            fetchRetry('http://someUrl', options);
          }).toThrow({
            name: 'ArgumentError',
            message: 'retryOn property expects an array or function'
          });
        });

      });

    });

  });

});

function defer() {
  var resolve, reject;
  var promise = new Promise(function () {
    resolve = arguments[0];
    reject = arguments[1];
  });
  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };
}
