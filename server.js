var slice = Array.prototype.slice

  , setupServer = function (url, object) {
      return function (req, res) {
        if (req.url.slice(0, url.length) !== url) return

        var fun = object[req.url.replace(url, '').replace(/^\//, '')]
          , chunks = []

        req.on('data', function (chunk) { chunks.push(chunk) })
        req.once('end', function () {
          var inputArgs = JSON.parse(Buffer.concat(chunks).toString())

          inputArgs.push(function () {
            res.write(JSON.stringify(slice.call(arguments)))
            res.end()
          })

          fun.apply(null, inputArgs)
        })
      }
    }

module.exports = setupServer