var unflatten = require('flat').unflatten

  , makeError = function (obj) {
      var err = new Error(obj.message)

      Object.keys(obj).forEach(function (key) {
        err[key] = obj[key]
      })

      return err
    }

  , setupClient = function (request) {
      return function (options) {
        var remote = {}
          , encoding = options.encoding || JSON

        options.methodNames.forEach(function (name) {
          remote[name] = function () {
            var args = Array.prototype.slice.call(arguments)
              , sync = typeof(args[args.length - 1]) !== 'function'
              , callback = sync ? undefined : args.pop()

            request({
                url: options.url + '/' + name
              , method: 'POST'
              , body: encoding.stringify({ args: args, sync: sync })
              , timeout: options.timeout || 30 * 1000
            }, function (err, resp, body) {
                var args;
                if (sync) return
                if (err) return callback(err)

                try {
                  args = encoding.parse(body)
                  if (args[0]) args[0] = makeError(args[0])
                } catch (err) {
                  err.type = 'ParseError'
                  err.source = body
                  return callback(err)
                }

                callback.apply(null, args)
              }
            )
          }
        })

        return unflatten(remote)
      }
    }

module.exports = setupClient
