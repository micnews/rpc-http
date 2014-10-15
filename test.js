var http = require('http')

  , servertest = require('servertest')
  , test = require('tape')

  , setupRpc = require('./server')

test('simple server test', function (t) {
  var rpc = setupRpc('/rpc', {
        fooBar: function (a, b, callback) {
          t.equal(a, 'a')
          t.equal(b, 'b')
          callback(null, 'beep', 'boop')
        }
      })
    , server = http.createServer(rpc)
    , stream = servertest(server, '/rpc/fooBar', { encoding: 'json', method: 'POST' }, function (err, res) {
        if (err) return t.end(err)

        t.equal(res.statusCode, 200)
        t.deepEqual(res.body, [ null, 'beep', 'boop' ])
        t.end()
      })

  stream.write('["a","b"]')
  stream.end()
})