
var isObj = function (value) {
      return typeof(value) === 'object' && value !== null
    }

  , isDate = function (value) {
      return value instanceof Date
    }

  , isRegexp = function (value) {
      return !!(value && value.compile && value.exec && value.source && value.test)
    }

  , iterate = function (obj) {
      if (isObj(obj)) {
        if (Array.isArray(obj)) {
          return obj.slice(0).map(iterate)
        }

        if (isDate(obj)) {
          return 'd' + obj.toJSON()
        }

        if (isRegexp(obj)) {
          return 'r' + obj.toString()
        }

        if (Buffer.isBuffer(obj)) {
          return 'b' + obj.toString('hex')
        }

        return Object.keys(obj).reduce(function (copy, key) {
          copy[key] = iterate(obj[key])
          return copy
        }, {})
      }

      if (typeof(obj) === 'string') {
        return 's' + obj
      }

      return obj
    }

  , stringify = function (obj) {
      return JSON.stringify(iterate(obj))
    }

module.exports = stringify
