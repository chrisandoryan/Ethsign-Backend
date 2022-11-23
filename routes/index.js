var express = require('express');
var multer = require("multer");

const { storage } = require('../lib/upload');
const { ipfs } = require('../lib/ipfs');
const Document = require('../database/Document');
const crypto = require('crypto');

var router = express.Router();

router.get('/documents', async function (req, res, next) {
  const user = req.user;
  let documents = await Document.find({ uploader_id: user.id });

  if (documents) {
    return res.json({
      success: true,
      documents: documents
    });
  }
  else {
    return res.json({
      success: false,
      message: 'No document found',
      documents: []
    });
  }
});

router.post('/upload', multer({
  storage: storage
}).single("user_doc"), async function (req, res, next) {
  const user = req.user;
  let file = req.file ? req.file.buffer : false;
  let doc_title = req.body.document_title;
  let signers = req.body.signer_ids;

  // Add the uploader as the signer as well
  signers.push(user.wallet_address);

  if (!file) {
    return res.status(400).send({
      status: false,
      data: "No document is found, please re-upload your file if you think this is a mistake.",
    });
  }

  const openSign = req.app.openSignInstance;

  let doc_buffer = req.file.buffer;
  let ipfs_response = await ipfs.add(doc_buffer);
  let ipfs_hash = ipfs_response.cid.multihash.digest;
  let ipfs_hash_hex = Buffer.from(ipfs_hash.buffer).toString("hex");
  let doc_id = crypto.randomBytes(32);
  let doc_id_hex = "0x" + doc_id.toString('hex');

  openSign.addDocument(doc_id_hex, ipfs_hash, { from: user.wallet_address })
    .then(async (_result) => {
      let document = new Document({
        doc_id: doc_id_hex,
        doc_title: doc_title,
        file_size: req.file.size,
        ipfs_hash: ipfs_hash_hex,
        uploader_address: user.wallet_address,
        signer_addresses: signers
      });
      await document.save();

      return res.json({
        success: true,
        doc_id: doc_id_hex,
        ipfs_hash: ipfs_hash_hex
      });
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: err
      });
    })
});

router.get('/documents/:document_id', async function (req, res, next) {
  const user = req.user;
  let document_id = req.params.document_id;

  let document = await Document.findOne({ 
    doc_id: document_id, 
    uploader_address: user.wallet_address, 
  });

  console.log(document);

  if (document) {
    let ipfs_file = await ipfs.get(document.ipfs_hash);
    console.log(ipfs_file);
  }
});

router.post('/sign/:document_id', async function (req, res, next) {
  const user = req.user;
  let document_id = req.params.document_id;

  let document = await Document.findOne({ 
    doc_id: document_id, 
    signer_addresses: user.wallet_address, 
    signed_addresses: { "$ne": user.wallet_address } 
  });

  if (document) {
    const openSign = req.app.openSignInstance;
    openSign.signDocument(document_id, { from: user.wallet_address })
      .then(async (_result) => {
        document.signed_addresses.push(user.wallet_address);
        document.save();
        return res.json({
          success: true,
          doc_id: document_id,
        });
      });
  }
  else {
    res.json({
      success: false,
      message: "The requested document is not available, you have signed it previously, or you don't have permission to sign it."
    })
  }
})

router.post('/verify', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
