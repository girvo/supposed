module.exports = (describe) => {
  const expectedContext = {
    context: {
      foo: 'bar'
    }
  }

  return describe('assertion output', {
    'when an assertion passes, and returns an object with a `context` property': {
      when: async () => {
        const sut = describe.Suite({ reporter: 'ARRAY', match: null })
        const expectedBehavior = 'returns-context'
        await sut(expectedBehavior, (t) => expectedContext)
        return { events: sut.reporters[0].events, expectedBehavior }
      },
      'it should include the context in the event': (t) => (err, actual) => {
        t.ifError(err)
        const found = actual.events.find((event) => event.behavior === actual.expectedBehavior)
        t.strictEqual(found.type, 'TEST')
        t.strictEqual(found.status, 'PASSED')
        t.strictEqual(found.context, expectedContext.context)
      }
    },
    'when an assertion passes, and returns a Promise with a `context` property': {
      when: async () => {
        const sut = describe.Suite({ reporter: 'ARRAY', match: null })
        const expectedBehavior = 'returns-context'
        await sut(expectedBehavior, (t) => Promise.resolve(expectedContext))
        return { events: sut.reporters[0].events, expectedBehavior }
      },
      'it should include the context in the event': (t) => (err, actual) => {
        t.ifError(err)
        const found = actual.events.find((event) => event.behavior === actual.expectedBehavior)
        t.strictEqual(found.type, 'TEST')
        t.strictEqual(found.status, 'PASSED')
        t.strictEqual(found.context, expectedContext.context)
      }
    }
  })
}