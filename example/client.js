var client = require('../')({
  url: '/rpc',
  methodNames: window.rpcMethodNames
});
var log = document.querySelector('.log')

client.hello('world', function (err, result) {
  console.log('Classig hello world example')
  console.log(result)
})

client.foo.bar(function (err, result) {
  console.log('nested objet also works!')
  console.log(result)
})

client.failing(function (err) {
  console.log('sometimes things do not go as expected, so here is an error')
  console.log(err)
})