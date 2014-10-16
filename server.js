var slice = Array.prototype.slice

  , serializeError = function (err) {
      var obj = { message: err.message, stack: err.stack }

      Object.keys(err).forEach(function (key) {
        obj[key] = err[key]
      })

      return obj
    }

  , setupServer = function (url, object) {
      var handler = function (req, res) {
        if (req.url.slice(0, url.length) !== url) return

        var fun = object[req.url.replace(url, '').replace(/^\//, '')]
          , chunks = []

        req.on('data', function (chunk) { chunks.push(chunk) })
        req.once('end', function () {
          var inputArgs = JSON.parse(Buffer.concat(chunks).toString())

          inputArgs.push(function () {
            var args = slice.call(arguments)

            if (args[0]) {
              args[0] = serializeError(args[0])
            }

            res.write(JSON.stringify(args))
            res.end()
          })

          fun.apply(null, inputArgs)
        })
      }

      handler.methodNames = Object.keys(object)

      return handler
    }

module.exports = setupServer