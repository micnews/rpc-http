var makeError = function (obj) {
      var err = new Error(obj.message)

      Object.keys(obj).forEach(function (key) {
        err[key] = obj[key]
      })

      return err
    }

  , setupClient = function (request) {
      return function (url, names, options) {
        options = options || {}

        var remote = {}

        names.forEach(function (input) {
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
                url: url + '/' + input
              , method: 'POST'
              , body: JSON.stringify({ args: args, sync: sync })
              , timeout: options.timeout || 30 * 1000
            }, function (err, resp, body) {
                if (sync) return
                if (err) return callback(err)

                var args = JSON.parse(body)

                if (args[0]) {
                  args[0] = makeError(args[0])
                }

                callback.apply(null, args)
              }
            )
          }
        })

        return remote
      }
    }

module.exports = setupClient