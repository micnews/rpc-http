var parseRegexp = function (str) {
      var pattern = str.slice(str.indexOf('/') + 1, str.lastIndexOf('/'))
        , flags = str.slice(str.lastIndexOf('/') + 1)

      return new RegExp(pattern, flags)
    }

  , parseString = function (str) {
      var slice = str[0]

      if (slice === 'd') return new Date(str.slice(1))

      if (slice === 'b') return new Buffer(str.slice(1), 'base64')

      if (slice === 'r') return parseRegexp(str.slice(1))

      return str.slice(1)
    }

  , parse = function (input, callback) {
      try {
        var obj = JSON.parse(input, function (key, value) {
              if (typeof(value) === 'string') {
                return parseString(value)
              }

              return value
            })
        callback(null, obj)
      } catch (err) {
        callback(err)
      }
    }

module.exports = parse