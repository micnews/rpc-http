# rpc-http[![build status](https://secure.travis-ci.org/micnews/rpc-http.svg)](http://travis-ci.org/micnews/rpc-http)

dead simple rpc over http

[![NPM](https://nodei.co/npm/rpc-http.png?downloads&stars)](https://nodei.co/npm/rpc-http/)

[![NPM](https://nodei.co/npm-dl/rpc-http.png)](https://nodei.co/npm/rpc-http/)

## Installation

```
npm install rpc-http
```

## Usage

### Server

```js
var object = { foo: function (world, callback) { callback(null, 'Hello, ' + world) }

  , handler = require('rpc-http')('/rpc', object)

require('http').createServer(handler).listen(1234)
```

### Client (browserify)

```js
var options = {
        url: '/rpc'
      , methodNames = [ 'foo' ]
      , timeout: 5 * 1000 // optional, defaults to 30 seconds
    }

  , client = require('rpc-http')('/rpc', names)

client.foo('world', function (err, message) {
  console.log(message)
})

```

## Caveats

rpc-http can serialize JSON-types, Dates, RegExps & Buffers. `undefined` is transformed to `null`.

## Licence

Copyright (c) 2014 Mic Network, Inc

This software is released under the MIT license:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
