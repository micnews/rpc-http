var jsonBody = require('json-body')

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

  , error = function (err, res) {
      res.writeHead(500)
      res.write(JSON.stringify([ serializeError(err) ]))
      res.end()
    }

  , setupServer = function (url, object) {
      var flatten = flattenObject(object, {}, '')
        , handler = function (req, res) {
            if (req.url.slice(0, url.length) !== url) return

            var methodName = req.url.replace(url, '').replace(/^\//, '')
              , fun = flatten[methodName]
              , chunks = []

            if (!fun) {
              error(new Error('No method ' + methodName), res)
              return
            }

            jsonBody(req, function (err, input) {
              if (err) {
                error(err, res)
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

                  res.write(JSON.stringify(args))
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