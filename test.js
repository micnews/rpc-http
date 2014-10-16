var http = require('http')

  , servertest = require('servertest')
  , test = require('tape')

  , rpcClient = require('./client')(require('request'))
  , rpcServer = require('./server')

test('simple server test', function (t) {
  var rpc = rpcServer('/rpc', {
        foo: function (a, b, callback) {
          t.equal(a, 'a')
          t.equal(b, 'b')
          callback(null, 'beep', 'boop')
        }
      })
    , server = http.createServer(rpc)
    , stream = servertest(server, '/rpc/foo', { encoding: 'json', method: 'POST' }, function (err, res) {
        if (err) return t.end(err)

        t.equal(res.statusCode, 200)
        t.deepEqual(res.body, [ null, 'beep', 'boop' ])
        t.end()
      })

  t.deepEqual(rpc.methodNames, [ 'foo' ])

  stream.write('["a","b"]')
  stream.end()
})

test('simple client test', function (t) {
  var server = http.createServer(function (req, res) {
    t.equal(req.url, '/rpc/foo')

    var chunks = []
    req.on('data', function (chunk) { chunks.push(chunk) })
    req.on('end', function () {
      var body = Buffer.concat(chunks).toString()
      t.equal(body, '["a","b"]')
      res.end('[null,"beep","boop"]')
    })

  }).listen(0, function () {
    var url = 'http://localhost:' + server.address().port + '/rpc'
      , rpc = rpcClient(url, [ 'foo' ])

    rpc.foo('a', 'b', function (err, first, second) {
      if (err) return t.end(err)
      t.equal(first, 'beep')
      t.equal(second, 'boop')
      server.close()
      t.end()
    })
  })
})

test('compability', function (t) {
  var handler = rpcServer('/rpc', {
        foo: function (beep, boop, callback) {
          t.equal(beep, 'beep')
          t.equal(boop, 'boop')
          callback(null, 1, 2, 3)
        }
      })

  var server = http.createServer(handler)

  server.listen(0, function () {
    var url = 'http://localhost:' + server.address().port + '/rpc'
      , client = rpcClient(url, [ 'foo' ])

    client.foo('beep', 'boop', function (err, a1, a2, a3) {
      if (err) return t.end(err)

      t.equal(a1, 1)
      t.equal(a2, 2)
      t.equal(a3, 3)
      t.end()
      server.close()
    })
  })
})

test('error', function (t) {
  var handler = rpcServer('/rpc', {
        bar: function (callback) {
          var err = new Error('the message')

          err.foo = 'bar'
          err.hello = -1

          callback(err)
        }
      })

  var server = http.createServer(handler)

  server.listen(0, function () {
    var url = 'http://localhost:' + server.address().port + '/rpc'
      , client = rpcClient(url, [ 'bar' ])

    client.bar(function (err) {
      t.ok(err instanceof Error)
      if (err) {
        t.equal(err.message, 'the message')
        t.equal(err.foo, 'bar')
        t.equal(err.hello, -1)
      }

      t.end()
      server.close()
    })
  })
})