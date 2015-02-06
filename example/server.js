var fs = require('fs')
var handler = require('../')({
  methods: {
    hello: function (input, callback) {
      console.log('hello, ' + input);
      callback(null, 'Hello, ' + input)
    },
    foo: {
      bar: function (callback) {
        console.log('foo.bar!')
        callback(null, 'bar!')
      }
    },
    failing: function (callback) {
      console.log('failing :(')
      callback(new Error('WTF?'))
    }
  },
  url: '/rpc'
});
var serveBrowserify = require('serve-browserify')({ root: __dirname })

require('http').createServer(function (req, res) {
  if (req.url === '/client.js') {
    serveBrowserify(req, res);
  } 
  if (req.url === '/') {
    fs.readFile(__dirname + '/index.html', function (err, html) {
      html = html.toString().replace('{rpcMethodNames}', JSON.stringify(handler.methodNames));
      res.end(html)
    })
  }

  if (req.url.slice(1, 4) === 'rpc') {
    handler(req, res)
  }
}).listen(3000, function () {
  console.log('example server running on port 3000')
})
