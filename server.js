var bl = require('bl')

  , slice = Array.prototype.slice

  , isObj = function (obj) {
      return typeof(obj) === 'object' && obj !== null
    }

  , serializeError = function (err) {
      var obj = { message: err.message, stack: err.stack }

      Object.keys(err).forEach(function (key) {
        obj[key] = err[key]
      })

      return obj
    }

  , flattenObject = function (input, output, prefix) {
      Object.keys(input).forEach(function (key) {
        if (isObj(input[key])) {
          flattenObject(input[key], output, prefix + key + '.')
        } else if (typeof(input[key]) === 'function') {
          output[prefix + key] = input[key]
        }
      })

      return output
    }

  , error = function (encoding, err, res) {
      res.writeHead(500)
      res.write(encoding.stringify([ serializeError(err) ]))
      res.end()
    }

  , jsonBody = function (encoding, stream, callback) {
      stream.pipe(bl(function (err, buffer) {
        if (err) return callback(err)

        try {
          callback(null, encoding.parse(buffer.toString()))
        } catch (err) {
          callback(err)
        }
      }))
    }

  , setupServer = function (url, object, encoding) {
      encoding = encoding || JSON

      var flatten = flattenObject(object, {}, '')
        , handler = function (req, res) {
            if (req.url.slice(0, url.length) !== url) return

            var methodName = req.url.replace(url, '').replace(/^\//, '')
              , fun = flatten[methodName]
              , chunks = []

            if (!fun) {
              error(encoding, new Error('No method ' + methodName), res)
              return
            }

            jsonBody(encoding, req, function (err, input) {
              if (err) {
                error(encoding, err, res)
                return
              }

              if (input.sync) {
                fun.apply(null, input.args)
                res.end()
              } else {
                input.args.push(function () {
                  var args = slice.call(arguments)

                  if (args[0]) {
                    args[0] = serializeError(args[0])
                  }

                  res.write(encoding.stringify(args))
                  res.end()
                })
                fun.apply(null, input.args)
              }
            })
          }

      handler.methodNames = Object.keys(flatten)

      return handler
    }

module.exports = setupServer