var setupClient = function (request) {
      return function (url, names) {
        var remote = {}

        names.forEach(function (key) {
          remote[key] = function () {
            var args = Array.prototype.slice.call(arguments)
              , callback = args.pop()

            request({
                url: url + '/' + key
              , method: 'POST'
              , body: JSON.stringify(args)
              , timeout: 30 * 1000
            }, function (err, resp, body) {

                var args = JSON.parse(body)

                callback.apply(null, args)
              }
            )
          }
        })

        return remote
      }
    }

module.exports = setupClient