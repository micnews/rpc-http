var http = require('http')

  , test = require('tape')

  , rpcClient = require('./client')(require('request'))
  , rpcServer = require('./server')

  , setupTest = function (object, callback) {
      var handler = rpcServer('/rpc', object)

      http.createServer(handler).listen(0, function () {
        this.unref()
        var client = rpcClient('http://localhost:' + this.address().port + '/rpc', handler.methodNames)

        callback(null, handler, client)
      })
    }

test('compability', function (t) {
  var object = {
        foo: function (beep, boop, callback) {
          t.equal(beep, 'beep')
          t.equal(boop, 'boop')
          callback(null, 1, 2, 3)
        }
      }

  setupTest(object, function (err, handler, client) {
    client.foo('beep', 'boop', function (err, a1, a2, a3) {
      if (err) return t.end(err)

      t.equal(a1, 1)
      t.equal(a2, 2)
      t.equal(a3, 3)
      t.end()
    })
  })
})

test('error', function (t) {
  var object = {
        bar: function (callback) {
          var err = new Error('the message')

          err.foo = 'bar'
          err.hello = -1

          callback(err)
        }
      }

  setupTest(object, function (err, handler, client) {
    client.bar(function (err) {
      t.ok(err instanceof Error)
      if (err) {
        t.equal(err.message, 'the message')
        t.equal(err.foo, 'bar')
        t.equal(err.hello, -1)
      }

      t.end()
    })
  })
})

test('nested', function (t) {
  var object = {
        foo: {
          bar: function (world, callback) {
            t.equal(world, 'world')
            callback(null, 'Hello, ' + world)
          }
        }
      }

  setupTest(object, function (err, handler, client) {
    client.foo.bar('world', function (err, msg) {
      if (err) return t.end(err)

      t.equal(msg, 'Hello, world')
      t.end()
    })
  })
})

test('deeply nested', function (t) {
  var object = {
        foo: {
          bar: {
            bas: function (world, callback) {
              t.equal(world, 'world')
              callback(null, 'Hello, ' + world)
            }
          }
        }
      }

  setupTest(object, function (err, handler, client) {
    t.deepEqual(handler.methodNames, [ 'foo.bar.bas' ])

    client.foo.bar.bas('world', function (err, msg) {
      if (err) return t.end(err)

      t.equal(msg, 'Hello, world')
      t.end()
    })
  })
})

test('server wrapping none-methods', function (t) {
  var handler = rpcServer('/rpc', {
        foo: 'bar'
      })

  t.deepEqual(handler.methodNames, [])

  t.end()
})

test('error handling in client', function (t) {
  var client = rpcClient('http://does.not/exists', [ 'foo' ])

  client.foo(function (err) {
    t.ok(err instanceof Error)
    t.end()
  })
})

test('timeout is configurable', function (t) {
  var responded = false
    , handler = rpcServer(
          '/rpc'
        , {
            foo: function (callback) {
              setTimeout(function () {
                callback(null, 'huh?')
                t.equal(responded, true)
                t.end()
              }, 100)
            }
          }
      )

  http.createServer(handler).listen(function () {
    this.unref()

    var client = rpcClient('http://localhost:' + this.address().port + '/rpc', [ 'foo' ], { timeout: 50 })

    client.foo(function (err) {
      responded = true
      t.ok(err instanceof Error)
      if (err) {
        t.equal(err.code, 'ETIMEDOUT')
      }
    })
  })
})

test('wrap method that does not take callback', function (t) {
  var object = {
        hello: function (world) {
          t.equal(world, 'world')
          t.end()
        }
      }

  setupTest(object, function (err, handler, client) {
    client.hello('world')
  })
})