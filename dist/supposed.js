"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// Node, or global
;

(function (root) {
  // eslint-disable-line no-extra-semi
  'use strict';

  var module = {
    factories: {}
  };
  Object.defineProperty(module, 'exports', {
    get: function get() {
      return null;
    },
    set: function set(val) {
      module.factories["".concat(val.name, "Factory")] = val.factory;
    },
    // this property should show up when this object's property names are enumerated
    enumerable: true,
    // this property may not be deleted
    configurable: false
  });
  module.exports = {
    name: 'allSettled',
    factory: function factory() {
      'use strict';

      function allSettled(promises) {
        return Promise.all(promises.map(function (promise) {
          return new Promise(function (resolve) {
            try {
              promise.then(function (value) {
                resolve({
                  status: 'fullfilled',
                  value: value
                });
              }).catch(function (err) {
                resolve({
                  status: 'rejected',
                  reason: err
                });
              });
            } catch (err) {
              // most likely, we received something other than a promise in the array
              resolve({
                status: 'rejected',
                reason: err
              });
            }
          });
        }));
      }

      return {
        allSettled: allSettled
      };
    }
  };
  module.exports = {
    name: 'AsyncTest',
    factory: function factory(dependencies) {
      'use strict';

      var isPromise = dependencies.isPromise,
          publish = dependencies.publish,
          TestEvent = dependencies.TestEvent;

      function noop() {}
      /**
       * If the test is skipped, sets noops for given and when,
       * otherwise sets given and when to associated test variables
       * @param {Object} context
       */


      function useNoopsIfSkipped(context) {
        if (testIsSkipped(context.test)) {
          // there aren't any tests to run
          // set the when to the noop function
          context.given = noop;
          context.when = noop;
        } else {
          context.given = context.test.given || noop;
          context.when = context.test.when;
        }

        return context;
      }

      function testIsSkipped(test) {
        return test.skipped || // the test isn't skipped, but all of it's assertions are
        test.assertions.filter(function (a) {
          return a.skipped;
        }).length === test.assertions.length;
      }
      /**
       * Runs `given` and passes any output forward
       * @param {Object} context
       */


      function runGiven(context) {
        if (typeof context.given !== 'function' && _typeof(context.given) !== 'object') {
          return Promise.resolve(context);
        }

        try {
          var actual = context.given();

          if (isPromise(actual)) {
            return actual.then(function (value) {
              context.resultOfGiven = value;
              return context;
            }).catch(function (e) {
              context.err = e;
              throw e;
            });
          }

          context.resultOfGiven = actual;
          return Promise.resolve(context);
        } catch (e) {
          context.err = e;
          throw e;
        }
      }
      /**
       * Runs `when` and passes any output forward
       * @param {Object} context
       */


      function runWhen(context) {
        if (typeof context.when !== 'function' && _typeof(context.when) !== 'object') {
          return Promise.resolve(context);
        }

        try {
          var actual = context.when(context.resultOfGiven);

          if (isPromise(actual)) {
            return actual.then(function (value) {
              context.resultOfWhen = value;
              return context;
            }).catch(function (e) {
              context.err = e;
              return context;
            });
          }

          context.resultOfWhen = actual;
          return Promise.resolve(context);
        } catch (e) {
          context.err = e;
          return context;
        }
      }
      /**
       * Executes the assertions
       * @param {Object} context
       */


      function checkAssertions(context) {
        var promises = context.test.assertions.map(function (assertion) {
          return assertOne(context.batchId, assertion, function () {
            if (assertion.test.length > 1) {
              // the assertion accepts all arguments to a single function
              return assertion.test(context.config.assertionLibrary, context.err, context.resultOfWhen);
            }

            var maybeFunc = assertion.test(context.config.assertionLibrary);

            if (typeof maybeFunc === 'function') {
              // the assertion curries: (t) => (err, actual) => { ... }
              return maybeFunc(context.err, context.resultOfWhen);
            }

            return maybeFunc;
          });
        });
        return Promise.all(promises).then(function (events) {
          if (!Array.isArray(events)) {
            return context;
          }

          events.forEach(function (event) {
            context.outcomes.push(Object.assign({
              behavior: 'anonymous'
            }, event));
          });
          return context;
        });
      } // /checkAssertions


      function maybeLog(result) {
        return result && typeof result.log !== 'undefined' ? result.log : undefined;
      }

      function maybeContext(result) {
        return result && typeof result.context !== 'undefined' ? result.context : undefined;
      }
      /**
       * Executes one assertion
       * @param {Object} context
       */


      function assertOne(batchId, assertion, test) {
        var pass = function pass(result) {
          return publish({
            type: TestEvent.types.TEST,
            status: TestEvent.status.PASSED,
            batchId: batchId,
            behavior: assertion.behavior,
            log: maybeLog(result),
            context: maybeContext(result)
          });
        };

        var fail = function fail(e) {
          return publish({
            type: TestEvent.types.TEST,
            status: TestEvent.status.FAILED,
            batchId: batchId,
            behavior: assertion.behavior,
            error: e
          });
        };

        try {
          if (assertion.skipped) {
            return publish({
              type: TestEvent.types.TEST,
              status: TestEvent.status.SKIPPED,
              batchId: batchId,
              behavior: assertion.behavior
            });
          }

          var result = test();
          return isPromise(result) ? result.then(pass).catch(fail) : pass(result);
        } catch (e) {
          return fail(e);
        }
      } // /assertOne

      /**
       * The context for one flow
       * @param {Object} context
       */


      function Context(context) {
        var self = {
          test: context.test,
          config: context.config,
          batchId: context.batchId,
          timer: context.timer,
          given: context.given,
          when: context.when,
          resultOfGiven: context.resultOfGiven,
          resultOfWhen: context.resultOfWhen,
          outcomes: context.outcomes || [],
          err: context.err
        };
        return Object.seal(self);
      } // /Context
      // {
      //   given: [Function: when],
      //   when: [Function: when],
      //   assertions: [{
      //     behavior: 'when dividing a number by zero, we get Infinity',
      //     test: [Function: we get Infinity]
      //   }]
      // }


      function AsyncTest(test, config, batchId) {
        return function () {
          // we need a Promise wrapper, to timout the test if it never returns
          return new Promise(function (resolve, reject) {
            // run the tests concurrently
            setTimeout(function () {
              // setup the intial context
              var context = new Context({
                test: test,
                config: config,
                batchId: batchId,
                timer: setTimeout(function () {
                  publish({
                    type: TestEvent.types.TEST,
                    status: TestEvent.status.BROKEN,
                    batchId: batchId,
                    behavior: test.behavior,
                    error: new Error("Timeout: the test exceeded ".concat(context.config.timeout, " ms"))
                  }).then(resolve);
                }, config.timeout),
                err: null // null is the default

              }); // run the flow

              return Promise.resolve(context).then(useNoopsIfSkipped).then(runGiven).then(runWhen).then(checkAssertions).then(function (context) {
                clearTimeout(context.timer);
                return resolve(context.outcomes);
              }).catch(function (err) {
                clearTimeout(context.timer);
                publish({
                  type: TestEvent.types.TEST,
                  status: TestEvent.status.BROKEN,
                  batchId: batchId,
                  behavior: test.behavior,
                  error: err && err.error ? err.error : err
                }).then(resolve);
              }); // /flow
            }, 0); // /setTimeout
          }); // /outer Promise
        }; // /wrapper
      } // /AsyncTest


      return {
        AsyncTest: AsyncTest
      };
    } // /factory
    // /module

  };
  module.exports = {
    name: 'makeBatch',
    factory: function factory() {
      'use strict';

      function BatchComposer(options) {
        var givenSynonyms = options.givenSynonyms; // ['given', 'arrange']

        var whenSynonyms = options.whenSynonyms; // ['when', 'act', 'topic']

        var config = ['timeout', 'assertionLibrary', 'reporter'];
        var actions = givenSynonyms.concat(whenSynonyms, config);
        var tapSkipPattern = /^# SKIP /i;
        var tapSkipOrTodoPattern = /(^# SKIP )|(^# TODO )/i;

        var getBySynonyms = function getBySynonyms(synonyms) {
          return function (node) {
            var key = Object.keys(node).find(function (key) {
              return synonyms.indexOf(key) > -1;
            });
            return key ? node[key] : undefined;
          };
        };

        var getGiven = getBySynonyms(givenSynonyms);
        var getWhen = getBySynonyms(whenSynonyms);

        var isAssertion = function isAssertion(node, key) {
          return typeof node === 'function' && actions.indexOf(key) === -1;
        };

        var getAssertions = function getAssertions(behavior, node, skipped) {
          if (isAssertion(node, behavior)) {
            return [{
              behavior: behavior,
              test: node,
              skipped: skipped
            }];
          }

          return Object.keys(node).filter(function (key) {
            return isAssertion(node[key], key);
          }).map(function (key) {
            return {
              behavior: concatBehavior(behavior, key),
              test: node[key],
              skipped: skipped || isSkipped(key)
            };
          });
        };

        var isCommentedOut = function isCommentedOut(behavior) {
          return behavior.length >= 2 && behavior.trim().substring(0, 2) === '//';
        };

        var isTapSkipped = function isTapSkipped(behavior) {
          return tapSkipOrTodoPattern.test(behavior);
        };

        var isSkipped = function isSkipped(behavior) {
          if (behavior && (isCommentedOut(behavior) || isTapSkipped(behavior))) {
            return true;
          }

          return false;
        };

        var trimBehavior = function trimBehavior(behavior) {
          if (isCommentedOut(behavior)) {
            // remove the comments
            return behavior.substring(2).trim();
          } else if (tapSkipPattern.test(behavior)) {
            // remove the directive - it will be replaced in the TAP output
            return behavior.substring(7).trim();
          } else {
            return behavior.trim();
          }
        };

        var concatBehavior = function concatBehavior(behavior, key) {
          if (typeof key === 'string' && key.trim().length) {
            return "".concat(trimBehavior(behavior), ", ").concat(trimBehavior(key));
          }

          return trimBehavior(behavior);
        };

        function Layer(input) {
          var behavior = input.behavior,
              node = input.node,
              timeout = input.timeout,
              assertionLibrary = input.assertionLibrary;
          var parentSkipped = input.skipped;
          var parentGiven = input.given;
          var parentWhen = input.when;
          var parentWhenIsInheritedGiven = input.whenIsInheritedGiven;
          var skipped = parentSkipped || isSkipped(behavior);
          var assertions = getAssertions(behavior, node, skipped, timeout);
          var given = getGiven(node) || parentGiven;
          var when = getWhen(node);
          var whenIsInheritedGiven = parentWhenIsInheritedGiven || false; // false is the default

          if (when) {
            // an immediate when is present, so this overrides the parent
            whenIsInheritedGiven = false;
          }

          if (!when && parentWhen && !whenIsInheritedGiven) {
            // an immediate when is NOT present, there is a parent `when`, and
            // it's not the result if `if (!when && given)` - this when
            // should be inherited

            /*
            'when nested assertions have givens (make-batch inline-comments)': {
              given: () => 42,
              when: (given) => given * 2,
              'it should equal 84': (t) => (err, actual) => {
                t.ifError(err)
                t.strictEqual(actual, 84)
              },
              'and they stem from a parent with a when': {
                given: () => 1,
                'it should equal 2': (t) => (err, actual) => {
                  t.ifError(err)
                  t.strictEqual(actual, 2)
                }
              }
            }
            */
            when = parentWhen;
          } else if (!when && given) {
            // There are neither an immediate when, nor a parent when because the parent
            // when was actually a given (the result of this block)

            /*
            'when nested assertions have givens (make-batch if (!when && given))': {
              given: () => 42,
              'it should equal 42': (t) => (err, actual) => {
                t.ifError(err)
                t.strictEqual(actual, 42)
              },
              'and they stem from a parent with a when': {
                given: () => 1,
                'it should equal 1': (t) => (err, actual) => {
                  t.ifError(err)
                  t.strictEqual(actual, 1)
                }
              }
            }
            */
            whenIsInheritedGiven = true;
            when = given;
          }

          return {
            behavior: behavior,
            given: given,
            when: when,
            assertions: assertions,
            skipped: skipped,
            timeout: timeout,
            assertionLibrary: assertionLibrary,
            whenIsInheritedGiven: whenIsInheritedGiven
          };
        }

        function FlattenedTests(input) {
          var behavior = input.behavior,
              node = input.node,
              given = input.given,
              when = input.when,
              whenIsInheritedGiven = input.whenIsInheritedGiven,
              skipped = input.skipped,
              timeout = input.timeout,
              assertionLibrary = input.assertionLibrary;
          var layers = [];
          var parent = new Layer({
            behavior: behavior,
            node: node,
            given: given,
            when: when,
            whenIsInheritedGiven: whenIsInheritedGiven,
            skipped: skipped || node.skipped,
            timeout: timeout || node.timeout,
            assertionLibrary: assertionLibrary || node.assertionLibrary
          });

          if (Array.isArray(parent.assertions) && parent.assertions.length) {
            layers.push(parent);
          }

          Object.keys(node).filter(function (childKey) {
            return _typeof(node[childKey]) === 'object';
          }).map(function (childKey) {
            var childBehavior = concatBehavior(behavior, childKey);
            return FlattenedTests({
              behavior: childBehavior,
              node: node[childKey],
              given: parent.given,
              when: parent.when,
              whenIsInheritedGiven: parent.whenIsInheritedGiven,
              // skipping favors the parent over the child
              skipped: parent.skipped || isSkipped(childKey),
              // timeout and assertion lib favor the child over the parent
              timeout: node[childKey].timeout || parent.timeout,
              assertionLibrary: node[childKey].assertionLibrary || parent.assertionLibrary
            });
          }).forEach(function (mappedLayers) {
            mappedLayers.filter(function (mappedLayer) {
              return Array.isArray(mappedLayer.assertions) && mappedLayer.assertions.length;
            }).forEach(function (mappedLayer) {
              layers.push(mappedLayer);
            });
          });
          return layers;
        }

        var makeBatch = function makeBatch(tests) {
          return Object.keys(tests).reduce(function (batch, key) {
            return batch.concat(new FlattenedTests({
              behavior: key,
              node: tests[key]
            }));
          }, []);
        };

        return {
          makeBatch: makeBatch
        };
      } // /BatchComposer


      return {
        BatchComposer: BatchComposer
      };
    } // /factory
    // /exports

  };
  module.exports = {
    name: 'makeSuiteConfig',
    factory: function factory(dependencies) {
      'use strict';

      var defaults = dependencies.defaults,
          subscribe = dependencies.subscribe,
          subscriptionExists = dependencies.subscriptionExists,
          allSubscriptions = dependencies.allSubscriptions,
          reporterFactory = dependencies.reporterFactory;

      var makeSuiteId = function makeSuiteId() {
        return "S".concat((Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase());
      };

      var makeSuiteConfig = function makeSuiteConfig(options) {
        var suiteConfig = {
          assertionLibrary: defaults.assertionLibrary,
          match: defaults.match,
          name: makeSuiteId(),
          timeout: 2000,
          reporters: [],
          givenSynonyms: ['given', 'arrange'],
          whenSynonyms: ['when', 'act', 'topic']
        };
        options = _objectSpread({}, options);

        if (options.assertionLibrary) {
          suiteConfig.assertionLibrary = options.assertionLibrary;
        }

        if (typeof options.match === 'string') {
          suiteConfig.match = new RegExp(options.match);
        } else if (options.match && typeof options.match.test === 'function') {
          suiteConfig.match = options.match;
        }

        if (typeof options.name === 'string' && options.name.trim().length) {
          suiteConfig.name = options.name.trim();
        }

        if (typeof options.timeout === 'number' && options.timeout > 0) {
          suiteConfig.timeout = options.timeout;
        }

        if (typeof options.useColors === 'boolean') {
          suiteConfig.useColors = options.useColors;
        }

        if (Array.isArray(options.givenSynonyms)) {
          options.givenSynonyms.forEach(function (synonym) {
            if (typeof synonym === 'string' && synonym.trim().length) {
              suiteConfig.givenSynonyms.push(synonym);
            }
          });
        }

        if (Array.isArray(options.whenSynonyms)) {
          options.whenSynonyms.forEach(function (synonym) {
            if (typeof synonym === 'string' && synonym.trim().length) {
              suiteConfig.whenSynonyms.push(synonym);
            }
          });
        }

        var makeReporterArray = function makeReporterArray(input) {
          return input.split(',').map(function (reporter) {
            return reporter.trim().toUpperCase();
          });
        };

        var addReporter = function addReporter(nameOrFunc) {
          if (typeof nameOrFunc === 'string') {
            var reporter = reporterFactory.get(nameOrFunc);

            if (!subscriptionExists(reporter.name)) {
              subscribe(reporter);
            }

            suiteConfig.reporters.push(reporter);
          } else {
            reporterFactory.add(nameOrFunc);
            addReporter(nameOrFunc.name);
          }
        }; // reporters: accept strings, functions, or objects


        if (typeof options.reporter === 'string') {
          makeReporterArray(options.reporter).forEach(addReporter);
        } else if (typeof options.reporter === 'function') {
          addReporter(function CustomReporter() {
            return {
              write: options.reporter
            };
          });
        } else if (options.reporter && typeof options.reporter.report === 'function') {
          // legacy
          addReporter(function CustomReporter() {
            return {
              write: options.reporter.report
            };
          });
        } else if (options.reporter && typeof options.reporter.write === 'function') {
          addReporter(function CustomReporter() {
            return {
              write: options.reporter.write
            };
          });
        } // reporters: accept strings, or arrays


        if (typeof options.reporters === 'string') {
          makeReporterArray(options.reporters).forEach(addReporter);
        } else if (Array.isArray(options.reporters)) {
          options.reporters.forEach(addReporter);
        }

        if (!suiteConfig.reporters.length) {
          defaults.reporters.forEach(addReporter);
        }

        suiteConfig.subscriptions = allSubscriptions();

        suiteConfig.makeTheoryConfig = function (theory) {
          theory = _objectSpread({}, theory);
          return {
            timeout: theory.timeout || suiteConfig.timeout,
            assertionLibrary: theory.assertionLibrary || suiteConfig.assertionLibrary
          };
        };

        return suiteConfig;
      }; // /makeSuiteConfig


      return {
        makeSuiteConfig: makeSuiteConfig
      };
    } // /factory
    // /module

  };
  module.exports = {
    name: 'pubsub',
    factory: function factory(dependencies) {
      'use strict';

      var allSettled = dependencies.allSettled,
          isPromise = dependencies.isPromise,
          TestEvent = dependencies.TestEvent;

      var makeId = function makeId() {
        return "S".concat((Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase());
      };

      function Pubsub() {
        var subscriptions = [];

        var publish = function publish(input) {
          var event = new TestEvent(input);
          return allSettled(subscriptions.map(function (subscription) {
            var result = subscription.write(event);
            return isPromise(result) ? result : Promise.resolve(result);
          })).then(function () {
            return event;
          });
        };

        var subscribe = function subscribe(subscription) {
          var name = subscription.name || makeId();

          if (typeof subscription === 'function') {
            subscriptions.push({
              name: name,
              write: subscription
            });
          } else if (subscriptions && typeof subscription.write === 'function') {
            subscription.name = subscription.name || name;
            subscriptions.push(subscription);
          } else {
            throw new Error('Invalid subscription: expected either a function, or { name: string, write: function }');
          }
        };

        var subscriptionExists = function subscriptionExists(name) {
          if (subscriptions.find(function (subscription) {
            return subscription.name === name;
          })) {
            return true;
          }

          return false;
        };

        var allSubscriptions = function allSubscriptions() {
          return subscriptions.map(function (subscription) {
            return subscription.name;
          });
        };

        var reset = function reset() {
          subscriptions = [];
        };

        return {
          publish: publish,
          subscribe: subscribe,
          subscriptionExists: subscriptionExists,
          allSubscriptions: allSubscriptions,
          reset: reset
        };
      }

      return {
        Pubsub: Pubsub
      };
    }
  };
  var publishStartAndEnd = true;
  module.exports = {
    name: 'Suite',
    factory: function factory(dependencies) {
      'use strict';

      var allSettled = dependencies.allSettled,
          AsyncTest = dependencies.AsyncTest,
          findFiles = dependencies.findFiles,
          BatchComposer = dependencies.BatchComposer,
          makeSuiteConfig = dependencies.makeSuiteConfig,
          publish = dependencies.publish,
          subscribe = dependencies.subscribe,
          clearSubscriptions = dependencies.clearSubscriptions,
          reporterFactory = dependencies.reporterFactory,
          resolveTests = dependencies.resolveTests,
          runServer = dependencies.runServer,
          _runTests = dependencies.runTests,
          Tally = dependencies.Tally,
          TestEvent = dependencies.TestEvent;

      var makeBatchId = function makeBatchId() {
        return "B".concat((Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase());
      };

      var makeNormalBatch = function makeNormalBatch(description, assertions) {
        var batch = {};
        batch[description] = assertions;
        return batch;
      };

      var normalizeBatch = function normalizeBatch(description, assertions) {
        var descriptionType = _typeof(description);

        var assertionsType = _typeof(assertions);

        if (descriptionType === 'string' && assertionsType === 'function') {
          // description, IAssert
          return Promise.resolve(makeNormalBatch(description, {
            '': assertions
          }));
        } else if (descriptionType === 'string') {
          // description, IBDD|IAAA|IVow
          return Promise.resolve(makeNormalBatch(description, assertions));
        } else if (descriptionType === 'object') {
          // description is IBDD|IAAA|IVow
          return Promise.resolve(description);
        } else if (descriptionType === 'function') {
          // description is IAssert
          return Promise.resolve({
            '': description
          });
        } else {
          return Promise.reject(new Error('An invalid test was found: a test or batch of tests is required'));
        }
      }; // /normalizebatch


      var matcher = function matcher(config) {
        return function (theory) {
          if (!config.match) {
            return true;
          }

          for (var i = 0; i < theory.assertions.length; i += 1) {
            if (config.match.test(theory.assertions[i].behavior)) {
              return true;
            }
          }
        };
      };

      var mapper = function mapper(config, makeBatch, byMatcher) {
        return function (batch) {
          var batchId = makeBatchId();
          var processed = makeBatch(batch).filter(byMatcher);
          return {
            batchId: batchId,
            batch: processed,
            tests: processed.map(function (theory) {
              return new AsyncTest(theory, config.makeTheoryConfig(theory), batchId);
            })
          };
        };
      };

      var reduceResults = function reduceResults(results) {
        return results.reduce(function (output, current) {
          return Array.isArray(current.value) ? output.concat(current.value) : output.concat([current.value]);
        }, []);
      };

      var tester = function tester(config, mapToTests) {
        return function (description, assertions) {
          return normalizeBatch(description, assertions).then(mapToTests).then(function (context) {
            context.plan = {
              count: context.batch.reduce(function (count, item) {
                return count + item.assertions.length;
              }, 0),
              completed: 0
            };
            return context;
          }).then(function (context) {
            if (publishStartAndEnd) {
              return publish({
                type: TestEvent.types.START,
                time: Date.now(),
                suiteId: config.name
              }).then(function () {
                return context;
              });
            }

            return Promise.resolve(context);
          }).then(function (context) {
            var batchId = context.batchId,
                plan = context.plan;
            return publish({
              type: TestEvent.types.START_BATCH,
              batchId: batchId,
              time: Date.now(),
              suiteId: config.name,
              plan: plan
            }).then(function () {
              return context;
            });
          }).then(function (context) {
            var batchId = context.batchId,
                tests = context.tests;
            return allSettled(tests.map(function (test) {
              return test();
            })).then(function (results) {
              context.results = results;
              context.batchTotals = Tally.getTally().batches[batchId];
              return context;
            });
          }).then(function (context) {
            var batchId = context.batchId,
                plan = context.plan,
                batchTotals = context.batchTotals;
            return publish({
              type: TestEvent.types.END_BATCH,
              batchId: batchId,
              time: Date.now(),
              suiteId: config.name,
              plan: {
                count: plan.count,
                completed: batchTotals.total
              },
              totals: batchTotals
            }).then(function () {
              return context;
            });
          }).then(function (context) {
            var batchId = context.batchId,
                batchTotals = context.batchTotals,
                results = context.results;
            var output = {
              batchId: batchId,
              results: reduceResults(results),
              totals: batchTotals
            };

            if (publishStartAndEnd) {
              return publish(new TestEvent({
                type: TestEvent.types.END_TALLY,
                suiteId: config.name
              })).then(function () {
                return publish(new TestEvent({
                  type: TestEvent.types.END,
                  time: Date.now(),
                  suiteId: config.name,
                  totals: batchTotals
                }));
              }).then(function () {
                return output;
              });
            }

            return Promise.resolve(output);
          }).catch(function (e) {
            publish({
              type: TestEvent.types.TEST,
              status: TestEvent.status.BROKEN,
              behavior: 'Failed to load test',
              suiteId: config.name,
              error: e
            });
            throw e;
          });
        };
      };

      var runner = function runner(config, test) {
        return function (findAndRun) {
          return function () {
            publishStartAndEnd = false;
            return publish({
              type: TestEvent.types.START,
              time: Date.now(),
              suiteId: config.name
            }).then(function () {
              return findAndRun();
            }).then(function (output) {
              if (output.broken.length) {
                // these tests failed before being executed
                var brokenPromises = output.broken.map(function (error) {
                  return publish({
                    type: TestEvent.types.TEST,
                    status: TestEvent.status.BROKEN,
                    behavior: "Failed to load test: ".concat(error.filePath),
                    suiteId: config.name,
                    error: error
                  });
                });
                return allSettled(brokenPromises).then(function () {
                  return output;
                });
              }

              return Promise.resolve(output);
            }).then(function (output) {
              return publish(new TestEvent({
                type: TestEvent.types.END_TALLY,
                suiteId: config.name
              })).then(function () {
                return output;
              });
            }).then(function (output) {
              // only get the tally _after_ END_TALLY was emitted
              return {
                output: output,
                tally: Tally.getSimpleTally()
              };
            }).then(function (context) {
              return publish(new TestEvent({
                type: TestEvent.types.END,
                time: Date.now(),
                suiteId: config.name,
                totals: context.tally
              })).then(function () {
                return context;
              });
            }).then(function (_ref) {
              var output = _ref.output,
                  tally = _ref.tally;
              return {
                files: output.files,
                results: output.results,
                broken: output.broken,
                config: output.config,
                suite: test,
                totals: tally
              };
            });
          };
        };
      };

      var browserRunner = function browserRunner(config, test) {
        return function (options) {
          return function () {
            return Array.isArray(options.paths) ? runServer(test, options)(options) : findFiles(options).then(runServer(test, options));
          };
        };
      };
      /**
       * The test library
       * @param {Object} suiteConfig : optional configuration
      */


      function Suite(suiteConfig, envvars) {
        var configure = function configure(_suiteConfig) {
          if (_suiteConfig && suiteConfig) {
            Object.keys(suiteConfig).forEach(function (key) {
              _suiteConfig[key] = _suiteConfig[key] || suiteConfig[key];
            });
          }

          clearSubscriptions();
          subscribe(reporterFactory.get(Tally.name));
          var config = makeSuiteConfig(_suiteConfig);

          var _ref2 = new BatchComposer(config),
              makeBatch = _ref2.makeBatch;

          var byMatcher = matcher(config);
          var mapToTests = mapper(config, makeBatch, byMatcher);
          var test = tester(config, mapToTests);
          var findAndStart = browserRunner(config, test);
          var run = runner(config, test);
          /**
          // Make a newly configured suite
          */

          test.id = config.name; // @deprecated

          test.printSummary = function () {
            return publish(new TestEvent({
              type: TestEvent.types.END,
              time: Date.now(),
              suiteId: config.name,
              totals: Tally.getSimpleTally()
            }));
          };

          test.getTotals = function () {
            return Tally.getSimpleTally();
          };

          test.suiteName = config.name;

          test.runner = function (options) {
            options = options || {};

            if (envvars && envvars.file && typeof envvars.file.test === 'function') {
              options.matchesNamingConvention = envvars.file;
            }

            return {
              // find and run (node)
              run: run(function () {
                return findFiles(options).then(resolveTests(test)).then(_runTests(test));
              }),
              // run (browser|node)
              runTests: function runTests(tests) {
                if (Array.isArray(tests)) {
                  options.tests = tests;
                }

                return run(function () {
                  return _runTests(test)(options);
                })();
              },
              // start test server (browser)
              startServer: findAndStart(options)
            };
          };

          test.reporters = config.reporters;
          test.config = config;
          test.configure = configure;

          test.subscribe = function (subscription) {
            subscribe(subscription);
            return test;
          };

          test.dependencies = _suiteConfig && _suiteConfig.inject;
          test.reporterFactory = reporterFactory;
          return test;
        };

        return configure(suiteConfig);
      } // Suite.suites = []


      return {
        Suite: Suite
      };
    } // /factory
    // /module

  };
  module.exports = {
    name: 'TestEvent',
    factory: function factory() {
      'use strict';

      var TYPE_EXPRESSION = /(^START$)|(^START_BATCH$)|(^TEST$)|(^INFO$)|(^END_BATCH$)|(^END_TALLY$)|(^END$)/;
      var STATUS_EXPRESSION = /(^PASSED$)|(^SKIPPED$)|(^FAILED$)|(^BROKEN$)/;
      var testCount = 0;

      var makeJSONStringifiableError = function makeJSONStringifiableError(err) {
        var error = {
          message: err.message,
          stack: err.stack
        };
        Object.keys(err).forEach(function (key) {
          var _err = err[key];

          if (_err && _err.message) {
            error[key] = makeJSONStringifiableError(err[key]);
          } else {
            error[key] = err[key];
          }
        });
        return error;
      };

      var TestEvent = function TestEvent(event) {
        var self = {};
        event = Object.assign({}, event);
        self.type = getType(event.type);

        if (self.type === TestEvent.types.TEST) {
          testCount += 1;
          self.count = testCount;
        }

        if (typeof event.status === 'string' && STATUS_EXPRESSION.test(event.status)) {
          self.status = event.status;
        } else if (event.status) {
          self.status = 'UNKNOWN';
        }

        if (event.behavior) {
          self.behavior = event.behavior;
        }

        if (event.error) {
          self.error = makeJSONStringifiableError(event.error);
        }

        if (event.batchId) {
          self.batchId = event.batchId;
        }

        if (event.suiteId) {
          self.suiteId = event.suiteId;
        }

        if (event.plan) {
          self.plan = event.plan;
        }

        if (typeof event.log !== 'undefined') {
          self.log = event.log;
        }

        if (event.time) {
          self.time = event.time;
        }

        if (event.totals) {
          self.totals = event.totals;
        }

        if (event.context) {
          self.context = event.context;
        }

        return Object.freeze(self);
      };

      TestEvent.types = {
        START: 'START',
        START_BATCH: 'START_BATCH',
        TEST: 'TEST',
        INFO: 'INFO',
        END_BATCH: 'END_BATCH',
        END_TALLY: 'END_TALLY',
        END: 'END'
      };
      TestEvent.status = {
        PASSED: 'PASSED',
        SKIPPED: 'SKIPPED',
        FAILED: 'FAILED',
        BROKEN: 'BROKEN'
      };

      function getType(type) {
        if (TYPE_EXPRESSION.test(type)) {
          return type;
        }

        return 'UNKNOWN';
      }

      return {
        TestEvent: TestEvent
      };
    } // /factory
    // /module

  };
  module.exports = {
    name: 'runTests',
    factory: function factory(dependencies) {
      'use strict';

      var allSettled = dependencies.allSettled;

      var hasThen = function hasThen(obj) {
        return obj && typeof obj.then === 'function';
      };

      var toPromise = function toPromise(config, suite) {
        return function (input) {
          var err, test, path;

          try {
            if (typeof input === 'function') {
              test = input;
            } else if (input) {
              err = input.err;
              test = input.test;
              path = input.path;
            } else {
              throw new Error("Invalid runTests entry: expected input ".concat(_typeof(input), " to be a {function}, or { err?: Error; test: Function|Promise; path?: string; }"));
            }

            if (err) {
              err.filePath = path;
              return Promise.reject(err);
            }

            if (hasThen(test)) {
              // module.exports = test('something', (t) => {...})
              return test;
            } else if (suite && config.injectSuite !== false && typeof test === 'function') {
              // module.exports = function (test) {}
              // export = function (test) {}
              var maybePromise = test(suite, suite.dependencies);
              return hasThen(maybePromise) ? maybePromise : Promise.resolve(maybePromise);
            } else if (suite && config.injectSuite !== false && _typeof(test) === 'object' && typeof test.default === 'function') {
              // export default function (test) {}
              var _maybePromise = test.default(suite, suite.dependencies);

              return hasThen(_maybePromise) ? _maybePromise : Promise.resolve(_maybePromise);
            }

            return Promise.resolve();
          } catch (e) {
            e.filePath = path;
            return Promise.reject(e);
          }
        };
      };

      var mapToResults = function mapToResults(config) {
        var paths = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
        return function (results) {
          return Object.freeze({
            results: results.filter(function (result) {
              return result.status === 'fullfilled';
            }).map(function (result) {
              return result.value;
            }).filter(function (result) {
              return result;
            }),
            broken: results.filter(function (result) {
              return result.status !== 'fullfilled';
            }).map(function (result) {
              return result.reason;
            }),
            files: paths,
            config: config
          });
        };
      };

      var runTests = function runTests(suite) {
        return function (context) {
          var config = context.config,
              tests = context.tests,
              paths = context.paths;

          if (!tests) {
            throw new Error('run-tests expects tests to be provided');
          }

          return Promise.resolve(tests.map(toPromise(config || context, suite))).then(allSettled).then(mapToResults(config, paths));
        };
      };

      return {
        runTests: runTests
      };
    } // /factory
    // /module

  };
  module.exports = {
    name: 'consoleStyles',
    factory: function factory() {
      'use strict';

      var consoleStyles = [{
        name: 'reset',
        value: [0, 0]
      }, {
        name: 'bold',
        value: [1, 22]
      }, {
        name: 'italic',
        value: [3, 23]
      }, {
        name: 'underline',
        value: [4, 24]
      }, {
        name: 'dim',
        value: [2, 22]
      }, {
        name: 'hidden',
        value: [8, 28]
      }, {
        name: 'strikethrough',
        value: [9, 29]
      }, {
        name: 'inverse',
        value: [7, 27]
      }, {
        name: 'black',
        value: [30, 39]
      }, {
        name: 'blue',
        value: [34, 39]
      }, {
        name: 'cyan',
        value: [96, 39]
      }, {
        name: 'green',
        value: [32, 39]
      }, {
        name: 'green-hi',
        value: [92, 32]
      }, {
        name: 'grey',
        value: [90, 39]
      }, {
        name: 'magenta',
        value: [35, 39]
      }, {
        name: 'red',
        value: [31, 39]
      }, {
        name: 'white',
        value: [37, 39]
      }, {
        name: 'yellow',
        value: [33, 39]
      }, {
        name: 'bgBlack',
        value: [40, 49]
      }, {
        name: 'bgRed',
        value: [41, 49]
      }, {
        name: 'bgGreen',
        value: [42, 49]
      }, {
        name: 'bgYellow',
        value: [43, 49]
      }, {
        name: 'bgBlue',
        value: [44, 49]
      }, {
        name: 'bgMagenta',
        value: [45, 49]
      }, {
        name: 'bgCyan',
        value: [46, 49]
      }, {
        name: 'bgWhite',
        value: [47, 49]
      }].reduce(function (styles, style) {
        styles[style.name] = function (input) {
          return input;
        };

        return styles;
      }, {});

      consoleStyles.newLine = function () {
        return '\n';
      };

      return {
        consoleStyles: consoleStyles
      };
    }
  };
  module.exports = {
    name: 'BlockFormatter',
    factory: function factory(dependencies) {
      'use strict';

      var consoleStyles = dependencies.consoleStyles,
          DefaultFormatter = dependencies.DefaultFormatter;

      function BlockFormatter() {
        return DefaultFormatter({
          SYMBOLS: {
            PASSED: "".concat(consoleStyles.bgGreen(consoleStyles.black(' PASS ')), " "),
            FAILED: "".concat(consoleStyles.bgRed(consoleStyles.black(' FAIL ')), " "),
            BROKEN: "".concat(consoleStyles.bgMagenta(consoleStyles.black(' !!!! ')), " "),
            SKIPPED: "".concat(consoleStyles.bgYellow(consoleStyles.black(' SKIP ')), " "),
            INFO: "".concat(consoleStyles.bgCyan(consoleStyles.black(' INFO ')), " ")
          }
        });
      }

      return {
        BlockFormatter: BlockFormatter
      };
    }
  };
  module.exports = {
    name: 'BriefFormatter',
    factory: function factory(dependencies) {
      'use strict';

      var consoleStyles = dependencies.consoleStyles,
          DefaultFormatter = dependencies.DefaultFormatter,
          TestEvent = dependencies.TestEvent;

      function BriefFormatter() {
        var defaultFormat = DefaultFormatter({
          SYMBOLS: {
            PASSED: consoleStyles.green('✓ '),
            // heavy-check: '✔',
            FAILED: consoleStyles.red('✗ '),
            // heavy-x '✘',
            BROKEN: consoleStyles.red('!= '),
            // heavy-x '✘',
            SKIPPED: consoleStyles.yellow('⸕ '),
            INFO: consoleStyles.cyan('# ')
          }
        }).format;

        var format = function format(event) {
          if ([TestEvent.types.START, TestEvent.types.END].indexOf(event.type) > -1) {
            return defaultFormat(event);
          } else if (event.type === TestEvent.types.TEST && (event.status === TestEvent.status.FAILED || event.status === TestEvent.status.BROKEN)) {
            return defaultFormat(event);
          }
        };

        return {
          format: format
        };
      }

      return {
        BriefFormatter: BriefFormatter
      };
    }
  };
  module.exports = {
    name: 'DefaultFormatter',
    factory: function factory(dependencies) {
      'use strict';

      var consoleStyles = dependencies.consoleStyles,
          TestEvent = dependencies.TestEvent,
          SYMBOLS = dependencies.SYMBOLS;
      var newLine = consoleStyles.newLine();

      var formatInfo = function formatInfo(log) {
        if (typeof log === 'undefined') {
          return '';
        }

        return newLine + JSON.stringify(log, null, 2).split(newLine).map(function (line) {
          return "    ".concat(line);
        }).join(newLine);
      };

      var formatComparable = function formatComparable(input) {
        var output = JSON.stringify(input, null, 2);

        if (input && !output) {
          output = input.toString();
        }

        if (output.indexOf(newLine) > -1) {
          return output.split(newLine).map(function (line) {
            return "    ".concat(line);
          }).join(newLine).substring(4) + newLine;
        }

        return output;
      };

      var formatExpectedAndActual = function formatExpectedAndActual(error) {
        return "    expected: ".concat(consoleStyles.green(formatComparable(error.expected))) + "    actual: ".concat(consoleStyles.red(formatComparable(error.actual)));
      };

      var formatStack = function formatStack(error) {
        if (!error.stack) {
          return '';
        }

        var stack = error.stack.split(newLine).map(function (line) {
          return "    ".concat(line.trim());
        }).join(newLine);
        return error.expected && error.actual ? "".concat(newLine).concat(newLine).concat(stack).concat(newLine) : "".concat(newLine).concat(stack).concat(newLine);
      };

      function DefaultFormatter() {
        var format = function format(event) {
          if (event.type === TestEvent.types.START) {
            return "".concat(newLine).concat(SYMBOLS.INFO, "Running tests...");
          }

          if (event.type === TestEvent.types.END) {
            var totals = event.totals;
            return "".concat(newLine).concat(SYMBOLS.INFO, "total: ").concat(consoleStyles.cyan(totals.total)) + "  passed: ".concat(consoleStyles.green(totals.passed)) + "  failed: ".concat(consoleStyles.red(totals.failed + totals.broken)) + "  skipped: ".concat(consoleStyles.yellow(totals.skipped)) + "  duration: ".concat((totals.endTime - totals.startTime) / 1000).concat(newLine);
          } else if (event.type === TestEvent.types.INFO) {
            return "".concat(SYMBOLS[event.type]).concat(event.behavior).concat(formatInfo(event.log));
          } else if (event.type === TestEvent.types.TEST) {
            if (!event.error) {
              return "".concat(SYMBOLS[event.status]).concat(event.behavior).concat(formatInfo(event.log));
            } else if (event.error.expected && event.error.actual) {
              return "".concat(SYMBOLS[event.status]).concat(event.behavior).concat(newLine).concat(newLine) + formatExpectedAndActual(event.error) + formatStack(event.error);
            } else {
              return "".concat(SYMBOLS[event.status]).concat(event.behavior) + formatStack(event.error);
            }
          }
        }; // /format


        return {
          format: format
        };
      } // /Formatter


      return {
        DefaultFormatter: DefaultFormatter
      };
    }
  };
  module.exports = {
    name: 'JsonFormatter',
    factory: function factory(dependencies) {
      'use strict';

      var TestEvent = dependencies.TestEvent;

      function JsonFormatter() {
        var format = function format(event) {
          if (event.type === TestEvent.types.START) {
            return "[".concat(JSON.stringify({
              event: event
            }, null, 2), ",");
          } else if (event.type === TestEvent.types.END) {
            return "".concat(JSON.stringify({
              event: event
            }, null, 2), "]");
          } else if ([TestEvent.types.END_TALLY].indexOf(event.type) === -1) {
            return "".concat(JSON.stringify({
              event: event
            }, null, 2), ",");
          }
        };

        return {
          format: format
        };
      }

      return {
        JsonFormatter: JsonFormatter
      };
    }
  };
  module.exports = {
    name: 'MarkdownFormatter',
    factory: function factory(dependencies) {
      'use strict';

      var consoleStyles = dependencies.consoleStyles,
          TestEvent = dependencies.TestEvent;
      var newLine = consoleStyles.newLine();

      var addToMd = function addToMd(parts, md) {
        if (!parts.length) {
          return;
        }

        var part = parts.shift().trim();
        md[part] = md[part] || {};

        if (parts.length) {
          addToMd(parts, md[part]);
        }
      };

      var space = '                                                               ';

      var toBullets = function toBullets(md, layer) {
        if (typeof layer === 'undefined') layer = 0;
        var output = '';
        Object.keys(md).forEach(function (key) {
          var line = key.replace(/\n/g, newLine + space.substring(0, (layer + 1) * 2));
          output += space.substring(0, layer * 2) + "* ".concat(line).concat(newLine);
          output += toBullets(md[key], layer + 1);
        });
        return output;
      };

      var totals = function totals(_totals) {
        return "## Totals".concat(newLine) + "".concat(newLine, "- **total**: ").concat(_totals.total) + "".concat(newLine, "- **passed**: ").concat(_totals.passed) + "".concat(newLine, "- **failed**: ").concat(_totals.failed) + "".concat(newLine, "- **skipped**: ").concat(_totals.skipped) + "".concat(newLine, "- **duration**: ").concat((_totals.endTime - _totals.startTime) / 1000, "s");
      };

      function MarkdownFormatter() {
        var title = 'Tests';
        var md = {};

        var format = function format(event) {
          if (event.type === TestEvent.types.START) {
            title = event.suiteId;
          } else if (event.type === TestEvent.types.END) {
            return "# ".concat(title).concat(newLine).concat(newLine).concat(toBullets(md)).concat(newLine).concat(totals(event.totals));
          } else if (event.type === TestEvent.types.INFO) {// should we include info?
            // return `# ${event.behavior}${formatInfo(event.behavior, event.log, 'comment')}`
          } else if (event.type === TestEvent.types.TEST) {
            addToMd(event.behavior.split(','), md);
          }
        }; // /format


        return {
          format: format
        };
      } // /Formatter


      return {
        MarkdownFormatter: MarkdownFormatter
      };
    }
  };
  module.exports = {
    name: 'SummaryFormatter',
    factory: function factory(dependencies) {
      'use strict';

      var consoleStyles = dependencies.consoleStyles,
          DefaultFormatter = dependencies.DefaultFormatter,
          TestEvent = dependencies.TestEvent;

      function SummaryFormatter() {
        var defaultFormat = DefaultFormatter({
          // Other than INFO, these aren't actually used, since this doesn't produce TEST output
          SYMBOLS: {
            PASSED: consoleStyles.green('✓ '),
            FAILED: consoleStyles.red('✗ '),
            BROKEN: consoleStyles.red('!= '),
            SKIPPED: consoleStyles.yellow('⸕ '),
            INFO: consoleStyles.cyan('# ') // the `#` is important for TAP compliance

          }
        }).format;

        var format = function format(event) {
          if (event.type === TestEvent.types.END) {
            return defaultFormat(event);
          }
        };

        return {
          format: format
        };
      }

      return {
        SummaryFormatter: SummaryFormatter
      };
    }
  };
  module.exports = {
    name: 'SymbolFormatter',
    factory: function factory(dependencies) {
      'use strict';

      var consoleStyles = dependencies.consoleStyles,
          DefaultFormatter = dependencies.DefaultFormatter;

      function SymbolFormatter() {
        return DefaultFormatter({
          SYMBOLS: {
            PASSED: consoleStyles.green('✓ '),
            // heavy-check: '✔',
            FAILED: consoleStyles.red('✗ '),
            // heavy-x '✘',
            BROKEN: consoleStyles.red('!= '),
            // heavy-x '✘',
            SKIPPED: consoleStyles.yellow('⸕ '),
            INFO: consoleStyles.cyan('# ')
          }
        });
      }

      return {
        SymbolFormatter: SymbolFormatter
      };
    }
  };
  module.exports = {
    name: 'TapFormatter',
    factory: function factory(dependencies) {
      'use strict';

      var consoleStyles = dependencies.consoleStyles,
          TestEvent = dependencies.TestEvent;
      var newLine = consoleStyles.newLine();
      var whitespace = '        ';

      var reIndent = function reIndent(input, spaces, trim) {
        var indent = whitespace.substring(0, spaces);
        return input.split(newLine).map(function (line) {
          return "".concat(indent).concat(trim ? line.trim() : line);
        }).join(newLine).substring(spaces);
      };

      var formatMessage = function formatMessage(input) {
        var message = input.split(newLine).map(function (line) {
          return line.replace(/\s\s+/g, ' ').replace(/"/g, '\\"');
        }).join(' ');
        return "\"".concat(message, "\"");
      };

      var formatInfo = function formatInfo(behavior, log, severity) {
        if (typeof log === 'undefined') {
          return '';
        }

        var message = typeof log.message === 'string' ? log.message : "comment for: ".concat(behavior);
        return newLine + "  ---".concat(newLine) + "  message: \"".concat(message, "\"").concat(newLine) + "  severity: ".concat(severity).concat(newLine) + "  data:".concat(newLine) + "    ".concat(reIndent(JSON.stringify(log, null, 2), 4)).concat(newLine) + '  ...';
      };

      var formatError = function formatError(error, severity) {
        if (!error) {
          return '';
        }

        var actualAndExpectedExist = error.expected && error.actual;
        var stackExists = typeof error.stack === 'string';
        var output = "".concat(newLine, "  ---").concat(newLine) + "  message: ".concat(formatMessage(error.message)).concat(newLine) + "  severity: ".concat(severity).concat(newLine);

        if (actualAndExpectedExist && stackExists) {
          output += "  data:".concat(newLine);
          output += "    got: ".concat(error.actual).concat(newLine);
          output += "    expect: ".concat(error.expected).concat(newLine);
          output += "    stack: ".concat(reIndent(error.stack, 6, true)).concat(newLine);
        } else if (actualAndExpectedExist) {
          output += "  data:".concat(newLine);
          output += "    got: ".concat(error.actual).concat(newLine);
          output += "    expect: ".concat(error.expected).concat(newLine);
        } else if (stackExists) {
          output += "  data:".concat(newLine);
          output += "    stack: ".concat(reIndent(error.stack, 6, true)).concat(newLine);
        }

        output += '  ...';
        return output;
      };

      function TapFormatter() {
        var format = function format(event) {
          if (event.type === TestEvent.types.START) {
            return 'TAP version 13';
          }

          if (event.type === TestEvent.types.END) {
            return "1..".concat(event.totals.total);
          } else if (event.type === TestEvent.types.INFO) {
            return "# ".concat(event.behavior).concat(formatInfo(event.behavior, event.log, 'comment'));
          } else if (event.type === TestEvent.types.TEST) {
            switch (event.status) {
              case TestEvent.status.PASSED:
                return "ok ".concat(event.count, " - ").concat(event.behavior).concat(formatInfo(event.behavior, event.log, 'comment'));

              case TestEvent.status.SKIPPED:
                return event.behavior.indexOf('# TODO') > -1 ? "ok ".concat(event.count, " # TODO ").concat(event.behavior.replace('# TODO ', '')) : "ok ".concat(event.count, " # SKIP ").concat(event.behavior);

              case TestEvent.status.FAILED:
                return "not ok ".concat(event.count, " - ").concat(event.behavior).concat(formatError(event.error, 'fail'));

              case TestEvent.status.BROKEN:
                return "not ok ".concat(event.count, " - ").concat(event.behavior).concat(formatError(event.error, 'broken'));
            }
          }
        }; // /format


        return {
          format: format
        };
      } // /Formatter


      return {
        TapFormatter: TapFormatter
      };
    }
  };
  module.exports = {
    name: 'ArrayReporter',
    factory: function factory() {
      'use strict';

      function ArrayReporter() {
        var events = [];

        var write = function write(event) {
          return events.push(event);
        };

        return {
          write: write,
          events: events
        };
      }

      return {
        ArrayReporter: ArrayReporter
      };
    }
  };
  module.exports = {
    name: 'ConsoleReporter',
    factory: function factory(dependencies) {
      'use strict';

      var TestEvent = dependencies.TestEvent,
          formatter = dependencies.formatter;
      var format = formatter.format;

      function ConsoleReporter() {
        var write = function write(event) {
          if ([TestEvent.types.START, TestEvent.types.TEST, TestEvent.types.INFO, TestEvent.types.END].indexOf(event.type) > -1) {
            var line = format(event);

            if (line) {
              console.log(line);
            }
          }
        }; // /write


        return {
          write: write
        };
      }

      return {
        ConsoleReporter: ConsoleReporter
      };
    }
  };
  module.exports = {
    name: 'DomReporter',
    factory: function factory(dependencies) {
      'use strict';

      var TestEvent = dependencies.TestEvent,
          formatter = dependencies.formatter;
      var format = formatter.format;
      var reportDivId = 'supposed_report';
      var reportPreId = 'supposed_report_results';
      var reportDiv;
      var reportPre;

      var initDom = function initDom() {
        var _reportDiv = document.getElementById(reportDivId);

        if (_reportDiv) {
          reportDiv = _reportDiv;
          reportPre = document.getElementById(reportPreId);
          return;
        }

        reportDiv = document.createElement('div');
        reportDiv.setAttribute('id', reportDivId);
        document.body.appendChild(reportDiv);
        reportPre = document.createElement('pre');
        reportPre.setAttribute('id', reportPreId);
        reportDiv.appendChild(reportPre);
      };

      var scrollToBottom = function scrollToBottom() {
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function' && typeof document !== 'undefined' && document.body) {
          window.scrollTo(0, document.body.scrollHeight);
        }
      };

      function DomReporter() {
        initDom();

        var write = function write(event) {
          // write to the console
          if ([TestEvent.types.START, TestEvent.types.TEST, TestEvent.types.INFO, TestEvent.types.END].indexOf(event.type) > -1) {
            var line = format(event);

            if (!line) {
              return;
            }

            console.log(line);
            reportPre.append("".concat(line, "\n"));
            scrollToBottom();
          }
        }; // /write


        return {
          write: write
        };
      }

      return {
        DomReporter: DomReporter
      };
    }
  };
  module.exports = {
    name: 'NoopReporter',
    factory: function factory() {
      'use strict';

      function NoopReporter() {
        return {
          write: function write() {}
        };
      }

      return {
        NoopReporter: NoopReporter
      };
    }
  };
  module.exports = {
    name: 'reporterFactory',
    factory: function factory() {
      'use strict';

      function ReporterFactory() {
        var self = {};
        var map = {};

        var uppered = function uppered(name) {
          return typeof name === 'string' ? name.trim().toUpperCase() : undefined;
        };

        self.get = function (name) {
          var _name = uppered(name);

          if (!map[_name]) {
            throw new Error("A reporter by name, \"".concat(name, "\", is not registered"));
          }

          var reporter = map[_name];
          reporter.name = reporter.name || _name;
          return reporter;
        };

        self.add = function (reporter) {
          if (typeof reporter !== 'function') {
            throw new Error("Invalid Reporter: expected reporter {".concat(_typeof(reporter), "} to be a {function}"));
          }

          var errors = [];

          if (typeof reporter.name !== 'string' || reporter.name.trim().length < 1) {
            errors.push("Invalid Reporter: expected reporter.name {".concat(_typeof(reporter.name), "} to be a non-empty {string}"));
          }

          var _reporter = reporter();

          var write = _reporter && _reporter.write;

          if (typeof write !== 'function') {
            errors.push("Invalid Reporter: expected reporter().write {".concat(_typeof(write), "} to be a {function}"));
          }

          if (errors.length) {
            throw new Error(errors.join(', '));
          }

          var name = uppered(reporter.name);
          map[name] = _reporter;

          if (name.indexOf('REPORTER') > -1) {
            var shortName = name.substring(0, name.indexOf('REPORTER'));
            map[shortName] = _reporter;
          }

          return self;
        };

        return self;
      }

      return {
        ReporterFactory: ReporterFactory
      };
    }
  };
  module.exports = {
    name: 'Tally',
    factory: function factory(dependencies) {
      'use strict';

      var publish = dependencies.publish,
          TestEvent = dependencies.TestEvent;

      function TallyFactory() {
        var now = function now() {
          return Date.now();
        };

        var makeTally = function makeTally() {
          return {
            total: 0,
            passed: 0,
            skipped: 0,
            failed: 0,
            broken: 0,
            startTime: -1,
            endTime: -1
          };
        }; // there's only 1 tally per require


        var totals = {
          total: 0,
          passed: 0,
          skipped: 0,
          failed: 0,
          broken: 0,
          startTime: -1,
          endTime: -1,
          results: [],
          batches: {}
        };

        var makeBatchTally = function makeBatchTally(event) {
          if (totals.batches[event.batchId]) {
            return publish({
              type: TestEvent.types.TEST,
              status: TestEvent.status.BROKEN,
              batchId: event.batchId,
              error: new Error('Duplicate Batch Ids were created, or multiple START_BATCH events were emitted for the same batch')
            }).then(function () {
              return undefined;
            });
          }

          var tally = makeTally();
          tally.startTime = now();
          return Promise.resolve(tally);
        };

        var bump = function bump(event) {
          try {
            var name = event.status.toLowerCase();
            totals[name] += 1;
            totals.total += 1;

            if (totals.batches[event.batchId]) {
              totals.batches[event.batchId][name] += 1;
              totals.batches[event.batchId].total += 1;
            }

            totals.results.push(event);
          } catch (e) {
            console.log(event);
            console.log(e);
          }
        };

        function Tally() {
          var write = function write(event) {
            switch (event.type) {
              case TestEvent.types.START:
                totals.startTime = now();
                return Promise.resolve();

              case TestEvent.types.START_BATCH:
                return makeBatchTally(event).then(function (tally) {
                  if (tally) {
                    totals.batches[event.batchId] = tally;
                  }
                });

              case TestEvent.types.TEST:
                bump(event);
                return Promise.resolve();

              case TestEvent.types.END_BATCH:
                totals.batches[event.batchId].endTime = now();
                return Promise.resolve();

              case TestEvent.types.END_TALLY:
                totals.endTime = now();
                return Promise.resolve();
            } // /switch

          }; // /write


          return {
            name: 'Tally',
            write: write
          };
        } // /Tally


        Tally.getTally = function () {
          return _objectSpread({}, totals);
        };

        Tally.getSimpleTally = function () {
          var tally = Tally.getTally();
          return {
            total: tally.total,
            passed: tally.passed,
            skipped: tally.skipped,
            failed: tally.failed,
            broken: tally.broken,
            startTime: tally.startTime,
            endTime: tally.endTime
          };
        };

        return {
          Tally: Tally
        };
      } // /TallyFactory


      return {
        TallyFactory: TallyFactory
      };
    } // resolve the dependency graph

  };

  function isPromise(input) {
    return input && typeof input.then === 'function';
  }

  var suites = {};
  var supposed = null; // resolve the dependency graph

  function Supposed(options) {
    var _module$factories$all = module.factories.allSettledFactory({}),
        allSettled = _module$factories$all.allSettled;

    var _module$factories$run = module.factories.runTestsFactory({
      allSettled: allSettled
    }),
        runTests = _module$factories$run.runTests;

    var _module$factories$Tes = module.factories.TestEventFactory({}),
        TestEvent = _module$factories$Tes.TestEvent;

    var _module$factories$pub = module.factories.pubsubFactory({
      allSettled: allSettled,
      isPromise: isPromise,
      TestEvent: TestEvent
    }),
        Pubsub = _module$factories$pub.Pubsub;

    var _ref3 = new Pubsub(),
        publish = _ref3.publish,
        subscribe = _ref3.subscribe,
        subscriptionExists = _ref3.subscriptionExists,
        allSubscriptions = _ref3.allSubscriptions,
        reset = _ref3.reset;

    var envvars = {
      assertionLibrary: {},
      reporters: ['DEFAULT'],
      useColors: true
    };
    var consoleStyles = module.factories.consoleStylesFactory({
      envvars: envvars
    }).consoleStyles;

    var _module$factories$Tal = module.factories.TallyFactory({
      publish: publish,
      TestEvent: TestEvent
    }),
        TallyFactory = _module$factories$Tal.TallyFactory;

    var _TallyFactory = TallyFactory(),
        Tally = _TallyFactory.Tally;

    var _module$factories$rep = module.factories.reporterFactoryFactory({}),
        ReporterFactory = _module$factories$rep.ReporterFactory;

    var reporterFactory = new ReporterFactory();
    var ArrayReporter = module.factories.ArrayReporterFactory({}).ArrayReporter;
    reporterFactory.add(ArrayReporter);
    reporterFactory.add(function QuietReporter() {
      // legacy
      return {
        write: new ArrayReporter().write
      };
    });
    reporterFactory.add(module.factories.NoopReporterFactory({}).NoopReporter);
    reporterFactory.add(Tally);

    function DefaultFormatter(options) {
      return module.factories.DefaultFormatterFactory({
        consoleStyles: consoleStyles,
        TestEvent: TestEvent,
        SYMBOLS: options.SYMBOLS
      }).DefaultFormatter();
    }

    function ConsoleReporter(options) {
      return module.factories.DomReporterFactory({
        TestEvent: TestEvent,
        formatter: options.formatter
      }).DomReporter();
    }

    var symbolFormatter = module.factories.SymbolFormatterFactory({
      consoleStyles: consoleStyles,
      DefaultFormatter: DefaultFormatter
    }).SymbolFormatter();
    reporterFactory.add(function DefaultReporter() {
      return {
        write: ConsoleReporter({
          formatter: symbolFormatter
        }).write
      };
    }).add(function BlockReporter() {
      return {
        write: ConsoleReporter({
          formatter: module.factories.BlockFormatterFactory({
            consoleStyles: consoleStyles,
            DefaultFormatter: DefaultFormatter
          }).BlockFormatter()
        }).write
      };
    }).add(function BriefReporter() {
      return {
        write: ConsoleReporter({
          formatter: module.factories.BriefFormatterFactory({
            consoleStyles: consoleStyles,
            DefaultFormatter: DefaultFormatter,
            TestEvent: TestEvent
          }).BriefFormatter()
        }).write
      };
    }).add(function JsonReporter() {
      return {
        write: ConsoleReporter({
          formatter: module.factories.JsonFormatterFactory({
            TestEvent: TestEvent
          }).JsonFormatter()
        }).write
      };
    }).add(function MarkdownReporter() {
      return {
        write: ConsoleReporter({
          formatter: module.factories.MarkdownFormatterFactory({
            consoleStyles: consoleStyles,
            TestEvent: TestEvent
          }).MarkdownFormatter()
        }).write
      };
    }).add(function JustTheDescriptionsReporter() {
      return {
        write: ConsoleReporter({
          formatter: {
            format: function format(event) {
              if (event.type === TestEvent.types.TEST) {
                return symbolFormatter.format(event).split('\n')[0];
              } else {
                return symbolFormatter.format(event);
              }
            }
          }
        }).write
      };
    }).add(function SummaryReporter() {
      return {
        write: ConsoleReporter({
          formatter: module.factories.SummaryFormatterFactory({
            consoleStyles: consoleStyles,
            DefaultFormatter: DefaultFormatter,
            TestEvent: TestEvent
          }).SummaryFormatter()
        }).write
      };
    }).add(function TapReporter() {
      return {
        write: ConsoleReporter({
          formatter: module.factories.TapFormatterFactory({
            consoleStyles: consoleStyles,
            TestEvent: TestEvent
          }).TapFormatter()
        }).write
      };
    });

    var _module$factories$Asy = module.factories.AsyncTestFactory({
      isPromise: isPromise,
      publish: publish,
      TestEvent: TestEvent
    }),
        AsyncTest = _module$factories$Asy.AsyncTest;

    var _module$factories$mak = module.factories.makeBatchFactory({}),
        BatchComposer = _module$factories$mak.BatchComposer;

    var _module$factories$mak2 = module.factories.makeSuiteConfigFactory({
      defaults: envvars,
      subscriptionExists: subscriptionExists,
      subscribe: subscribe,
      allSubscriptions: allSubscriptions,
      reporterFactory: reporterFactory
    }),
        makeSuiteConfig = _module$factories$mak2.makeSuiteConfig;

    var _module$factories$Sui = module.factories.SuiteFactory({
      allSettled: allSettled,
      AsyncTest: AsyncTest,
      BatchComposer: BatchComposer,
      makeSuiteConfig: makeSuiteConfig,
      publish: publish,
      subscribe: subscribe,
      clearSubscriptions: reset,
      reporterFactory: reporterFactory,
      runTests: runTests,
      Tally: Tally,
      TestEvent: TestEvent
    }),
        Suite = _module$factories$Sui.Suite;

    var suite = new Suite(options);
    suite.Suite = Supposed;

    if (!suites[suite.config.name]) {
      suites[suite.config.name] = suite;
    }

    return suite;
  }

  supposed = Supposed({
    name: 'supposed'
  });
  suites.supposed = supposed;
  supposed.suites = suites;
  window.supposed = supposed;
})(window);