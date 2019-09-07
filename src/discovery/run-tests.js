module.exports = {
  name: 'runTests',
  factory: (dependencies) => {
    'use strict'

    const { allSettled } = dependencies

    const hasThen = (obj) => {
      return obj && typeof obj.then === 'function'
    }

    const toPromise = (config, suite) => ({ err, test, path }) => {
      try {
        if (err) {
          err.filePath = path
          return Promise.reject(err)
        }

        if (suite && config.injectSuite !== false && typeof test === 'function') {
          // module.exports = function (test) {}
          // export = function (test) {}
          const maybePromise = test(suite, suite.dependencies)
          return hasThen(maybePromise) ? maybePromise : Promise.resolve(maybePromise)
        } else if (
          suite &&
          config.injectSuite !== false &&
          typeof test === 'object' &&
          typeof test.default === 'function'
        ) {
          // export default function (test) {}
          const maybePromise = test.default(suite, suite.dependencies)
          return hasThen(maybePromise) ? maybePromise : Promise.resolve(maybePromise)
        }

        return Promise.resolve()
      } catch (e) {
        e.filePath = path
        return Promise.reject(e)
      }
    }

    const mapToResults = (config, paths) => (results) => {
      return Object.freeze({
        results: results
          .filter((result) => result.status === 'fullfilled')
          .map((result) => result.value)
          .filter((result) => result),
        broken: results
          .filter((result) => result.status !== 'fullfilled')
          .map((result) => result.reason),
        files: paths,
        config
      })
    }

    const runTests = (suite) => (context) => {
      const { config, tests, paths } = context

      if (!tests) {
        throw new Error('run-tests expects tests to be provided')
      }

      return Promise.resolve(tests.map(toPromise(config || context, suite)))
        .then(allSettled)
        .then(mapToResults(config, paths))
    }

    return { runTests }
  } // /factory
} // /module