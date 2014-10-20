var http = require('http')

  , JSONe = require('json-extended')
  , request = require('request')
  , test = require('tape')

  , rpcClient = require('./client')(request)
  , rpcServer = require('./server')

  , startServer = function (handler, callback) {
      http.createServer(handler).listen(0, function () {
        this.unref()
        callback(null, 'http://localhost:' + this.address().port)
      })
    }

  , setupTest = function (methods, callback) {
      var handler = rpcServer({ url: '/rpc', methods: methods})

      startServer(handler, function (err, baseUrl) {
        if (err) return callback(err)

        var client = rpcClient({ url: baseUrl + '/rpc', methodNames: handler.methodNames })

        callback(null, handler, client)
      })
    }

test('compability', function (t) {
  var methods = {
        foo: function (beep, boop, callback) {
          t.equal(beep, 'beep')
          t.equal(boop, 'boop')
          callback(null, 1, 2, 3)
        }
      }

  setupTest(methods, function (err, handler, client) {
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
  var methods = {
        bar: function (callback) {
          var err = new Error('the message')

          err.foo = 'bar'
          err.hello = -1

          callback(err)
        }
      }

  setupTest(methods, function (err, handler, client) {
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
  var methods = {
        foo: {
          bar: function (world, callback) {
            t.equal(world, 'world')
            callback(null, 'Hello, ' + world)
          }
        }
      }

  setupTest(methods, function (err, handler, client) {
    client.foo.bar('world', function (err, msg) {
      if (err) return t.end(err)

      t.equal(msg, 'Hello, world')
      t.end()
    })
  })
})

test('deeply nested', function (t) {
  var methods = {
        foo: {
          bar: {
            bas: function (world, callback) {
              t.equal(world, 'world')
              callback(null, 'Hello, ' + world)
            }
          }
        }
      }

  setupTest(methods, function (err, handler, client) {
    t.deepEqual(handler.methodNames, [ 'foo.bar.bas' ])

    client.foo.bar.bas('world', function (err, msg) {
      if (err) return t.end(err)

      t.equal(msg, 'Hello, world')
      t.end()
    })
  })
})

test('server wrapping none-methods', function (t) {
  var handler = rpcServer({ url: '/rpc', methods: { foo: 'bar' } })

  t.deepEqual(handler.methodNames, [])

  t.end()
})

test('error handling in client', function (t) {
  var client = rpcClient({
          url: 'http://does.not/exists'
        , methodNames: [ 'foo' ]
      })

  client.foo(function (err) {
    t.ok(err instanceof Error)
    t.end()
  })
})

test('bad method name from client', function (t) {
  startServer(rpcServer({ url: '/rpc', methods: {} }), function (err, baseUrl) {
    var client = rpcClient({
            url: baseUrl + '/rpc'
          , methodNames: ['foo']
        })

    client.foo(function (err) {
      t.ok(err instanceof Error)
      t.end()
    })
  })
})

test('none-json from client', function (t) {
  startServer(rpcServer({ url: '/rpc', methods: { foo: function () {} } }), function (err, baseUrl) {
    request.post(baseUrl + '/rpc/foo', { body: 'huh?' }, function (err, res) {
      t.equal(res.statusCode, 500)
      t.end()
    })
  })
})

test('error handling bad formatted data from server', function (t) {
  var responded = false
    , handler = function (req, res) { res.end('badly formatted json')}

  startServer(handler, function (err, baseUrl) {
    var client = rpcClient({
            url: baseUrl + '/rpc'
          , methodNames: [ 'foo' ]
        })

    client.foo(function (err) {
      t.ok(err instanceof Error)
      if (err) {
        t.equal(err.message, 'Unexpected token b')
      }
      t.end()
    })
  })
})

test('timeout is configurable', function (t) {
  var responded = false
    , handler = rpcServer({
          url: '/rpc'
        , methods: {
            foo: function (callback) {
              setTimeout(function () {
                callback(null, 'huh?')
                t.equal(responded, true)
                t.end()
              }, 100)
            }
          }
      })

  startServer(handler, function (err, baseUrl) {
    var client = rpcClient({
            url: baseUrl + '/rpc'
          , methodNames: [ 'foo' ]
          , timeout: 50
        })

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
  var methods = {
        hello: function (world) {
          t.equal(world, 'world')
          t.end()
        }
      }

  setupTest(methods, function (err, handler, client) {
    client.hello('world')
  })
})

test('custom encoding (json-extended)', function (t) {
  var methods = {
        hello: function (data, callback) {
          t.deepEqual(data, { foo: new Date(0) })
          callback(null, { bar: new Buffer([ 0, 1, 2 ]) })
        }
      }
    , handler = rpcServer({ url: '/rpc', methods: methods, encoding: JSONe })

    startServer(handler, function (err, baseUrl) {
      if (err) return callback(err)

      var client = rpcClient({
              url: baseUrl + '/rpc'
            , methodNames: [ 'hello' ]
            , encoding: JSONe
          })

    client.hello({ foo: new Date(0) }, function (err, data) {
      t.deepEqual(data, { bar: new Buffer([ 0, 1, 2 ]) })
      t.end()
    })
  })
})
