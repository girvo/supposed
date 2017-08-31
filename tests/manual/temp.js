const describe = require('../../index.js')
// const sut = describe.Suite({ reporter: 'QUIET', timeout: 10 })

describe({
  'when `when` returns a promise': {
    when: (resolve) => {
      return new Promise((resolve, reject) => {
        resolve(42)
      }).then(resolve)
    },
    'it should wait for that promise before continuing': (t) => (err, actual) => {
      t.ifError(err)
      t.equal(actual, 42)
    }
  }
})

// test.cb('Async Division by Zero, when dividing a number by zero, we get Infinity', t => {
//   // given
//   const input = 42

//   // when
//   setTimeout(() => {
//     const actual = divideByZero(input)

//     // then
//     t.equal(actual, Infinity)
//     t.end()
//   }, 0)
// })

// describe('Async Division by Zero with Promises, when dividing a number by zero, we get Infinity', t => {
//   // given
//   const input = 42

//   // when
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       resolve(divideByZero(input))
//     }, 0)
//   }).then(actual => {
//     // then
//     t.equal(actual, Infinity)
//   })
// })

// describe('Async Division by Zero with async, when dividing a number by zero, we get Infinity',
//   async t => {
//     // given
//     const input = 42

//     // when
//     const actual = await new Promise((resolve, reject) => {
//       setTimeout(() => {
//         resolve(divideByZero(input))
//       }, 0)
//     })

//     // then
//     t.equal(actual, Infinity)
//   })

// test.skip('and you can skip tests', t => {
//   t.fail('this should not run')
// })

function divideByZero (number) {
  return number / 0
}
