const { expect } = require('chai')
const supposed = require('../index.js')

supposed.Suite({
  name: 'supposed-tests.docs',
  assertionLibrary: expect
}).runner({
  cwd: __dirname
}).run()
// .then((context) => {
//   console.log(context)
// })
