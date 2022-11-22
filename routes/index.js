var express = require('express');
var EthCrypto = require("eth-crypto");
const { signerIdentity } = require('../lib/identity');

var router = express.Router();

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/sign', function (req, res, next) {
  const message = EthCrypto.hash.keccak256([
    { type: "string", value: "Hello World!" }
  ]);
  const signature = EthCrypto.sign(signerIdentity.privateKey, message);

  return res.status(200).send({
    'message': message,
    'signature': signature,
    'publicKey': signerIdentity.address
  })
});

router.post('/verify', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
