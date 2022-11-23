var express = require('express');
var EthCrypto = require("eth-crypto");
var multer = require("multer");

const { signerIdentity } = require('../lib/identity');
const { storage } = require('../lib/upload');
const { ipfs } = require('../lib/ipfs');

var router = express.Router();

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/_experimental_upload', multer({ storage: storage }).single("user_doc"), async function (req, res, next) {
  const file = req.file ? req.file.buffer : false;
  if (!file) {
    res.status(400).send({
      status: false,
      data: "Please attach a file!",
    });
  }

  let doc_buffer = req.file.buffer;
  let doc_bytes = Uint8Array.from(doc_buffer);
  const message = EthCrypto.hash.keccak256([
    { type: "bytes", value: doc_bytes }
  ]);

  const signature = EthCrypto.sign(signerIdentity.privateKey, message);
  res.status(200).json({
    'status': 'success',
    'message': message,
    'signature': signature,
    'publicKey': signerIdentity.address
  })
});

router.post('/upload', multer({ storage: storage }).single("user_doc"), async function (req, res, next) {
  const file = req.file ? req.file.buffer : false;
  if (!file) {
    res.status(400).send({
      status: false,
      data: "Please attach a file!",
    });
  }

  const accounts = req.app.accounts;
  const openSign = req.app.openSignInstance;

  let doc_buffer = req.file.buffer;
  let ipfs_response = await ipfs.add(doc_buffer)
  let ipfs_hash = ipfs_response.cid.multihash.digest
  let doc_id = EthCrypto.hash.keccak256([
    { type: "bytes", value: ipfs_hash }
  ]);

  openSign.addDocument(doc_id, ipfs_hash, { from: accounts[0] })
    .then((_result) => {
      console.log(_result);

      res.status(200).json({
        'status': 'success',
        'doc_id': doc_id,
        'ipfs_hash': Buffer.from(ipfs_hash.buffer).toString("hex")
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ "status": "failed", "reason": err })
    })

});

router.post('/verify', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
