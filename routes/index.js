var express = require('express');
var EthCrypto = require("eth-crypto");
var multer = require("multer");

const { signerIdentity } = require('../lib/identity');
const { storage } = require('../lib/upload');
const ipfsClient = require('ipfs-http-client');

const ipfs = ipfsClient.create({
  host: 'ipfs.infura.io',
  port: 5001, protocol: 'https'
});


var router = express.Router();

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/sign', multer({ storage: storage }).single("user_doc"), function (req, res, next) {
  const file = req.file ? req.file.buffer : false;
  if (!file) {
    res.status(400).send({
      status: false,
      data: "Please attach a file!",
    });
  }

  let file_name = req.file.filename;
  let bytes = Uint8Array.from(req.file.buffer);
  const message = EthCrypto.hash.keccak256([
    { type: "string", value: file_name },
    { type: "bytes", value: bytes },
  ]);

  const signature = EthCrypto.sign(signerIdentity.privateKey, message);

  return res.status(200).send({
    'message': message,
    'signature': signature,
    'publicKey': signerIdentity.address
  });

});

router.post('/verify', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
