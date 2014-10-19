var parse = require('./parse')
  , stringify = require('./stringify')

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

        options.methodNames.forEach(function (input) {
          var obj = remote
            , parts = input.split('.')
            , key = parts.shift()

          while(parts.length > 0) {
            obj[key] = obj[key] || {}
            obj = obj[key]
            key = parts.shift()
          }

          obj[key] = function () {
            var args = Array.prototype.slice.call(arguments)
              , sync = typeof(args[args.length - 1]) !== 'function'
              , callback = sync ? undefined : args.pop()

            request({
                url: options.url + '/' + input
              , method: 'POST'
              , body: stringify({ args: args, sync: sync })
              , timeout: options.timeout || 30 * 1000
            }, function (err, resp, body) {
                if (sync) return
                if (err) return callback(err)

                parse(body, function (err, args) {
                  if (err) return callback(err)

                  if (args[0]) args[0] = makeError(args[0])

                  callback.apply(null, args)
                })
              }
            )
          }
        })

        return remote
      }
    }

module.exports = setupClient