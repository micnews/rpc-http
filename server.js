var collect = require('collect-stream')
  , filter = require('object-filter')
  , flat = require('flat')
  , isFunction = require('core-util-is').isFunction
  , isObject = require('core-util-is').isObject

  , slice = Array.prototype.slice

  , serializeError = function (err) {
      var obj = { message: err.message, stack: err.stack }

      Object.keys(err).forEach(function (key) {
        obj[key] = err[key]
      })

      return obj
    }

  , error = function (encoding, err, res) {
      res.writeHead(500)
      res.write(encoding.stringify([ serializeError(err) ]))
      res.end()
    }

  , parseResponse = function (encoding, stream, callback) {
      collect(stream, function (err, buffer) {
        if (err) return callback(err)

        try {
          callback(null, encoding.parse(buffer.toString()))
        } catch (err) {
          callback(err)
        }
      })
    }

  , setupServer = function (options) {
      var encoding = options.encoding || JSON
        , url = options.url
        , flatten = filter(flat(options.methods), isFunction)
        , handler = function (req, res) {
            if (req.url.slice(0, url.length) !== url) return

            var methodName = req.url.replace(url, '').replace(/^\//, '')
              , fun = flatten[methodName]
              , chunks = []

            if (!fun) {
              error(encoding, new Error('No method ' + methodName), res)
              return
            }

            parseResponse(encoding, req, function (err, input) {
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