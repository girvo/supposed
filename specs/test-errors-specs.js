const describe = require('../index.js')
const sut = describe.Suite({ reporter: 'QUIET', timeout: 10 })

describe('errors', {
  'when the `when` throws an error': {
    when: (resolve) => {
      sut({
        'when the `when` throws an error': {
          when: () => { throw new Error('BOOM!') },
          'it should pass the error to the assertions': (t, err) => {
            t.equal(typeof err, 'object')
            t.equal(err.message, 'BOOM!')
          }
        }
      }).then(resolve)
    },
    'it should pass the error to the assertions': (t, err, actual) => {
      t.ifError(err)
      t.equal(actual.totals.passed, 1)
    }
  },
  'when the `when` rejects': {
    when: (resolve) => {
      sut({
        'when the `when` rejects': {
          when: (resolve, reject) => {
            reject(new Error('Boom!'))
          },
          'it should pass the rejection to the `err` argument': (t, err) => {
            t.equal(typeof err, 'object')
            t.equal(err.message, 'Boom!')
          }
        }
      }).then(resolve)
    },
    'it should pass the error to the assertions': (t, err, actual) => {
      t.ifError(err)
      t.equal(actual.totals.passed, 1)
    }
  },
  'when the assertion throws an error': {
    when: (resolve) => {
      sut({
        'when the assertion throws an error': {
          'the test should fail': () => {
            throw new Error('assertion ERROR!')
          }
        }
      }).then(resolve)
    },
    'the test should fail': (t, err, actual) => {
      t.ifError(err)
      t.equal(actual.totals.failed, 1)
      t.equal(actual.results[0].error.message, 'assertion ERROR!')
    }
  },
  'when `when` is never resolved': {
    when: (resolve) => {
      sut({
        'when `when` is never resolved': {
          when: () => {},
          'it should throw a timeout exception': t => {
            t.fail('it should not get here')
          }
        }
      }).then(resolve)
    },
    'the test should be reported as BROKEN': (t, err, actual) => {
      t.ifError(err)
      t.equal(actual.totals.broken, 1)
      t.equal(actual.results[0].error.message, 'Timeout: the test exceeded 10 ms')
    }
  }
})
