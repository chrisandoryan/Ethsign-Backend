var express = require('express');
var multer = require("multer");

const fs = require('fs');
const { storage } = require('../lib/upload');
const { ipfs } = require('../lib/ipfs');
const Document = require('../database/Document');
const crypto = require('crypto');
const { arrayEquals, tarballed } = require('../lib/utils');
const { Blob } = require('node:buffer');

var router = express.Router();

router.get('/documents', async function (req, res, next) {
  const user = req.user;
  let documents = await Document.aggregate([
    {
      $match: {
        uploader_address: user.wallet_address,
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "signer_addresses",
        foreignField: "wallet_address",
        as: "signers"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "signed_addresses",
        foreignField: "wallet_address",
        as: "signeds"
      }
    }
  ]);

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
  let signers = req.body.signer_ids ?? [];

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
  let file_type = req.file.mimetype;
  let ipfs_response = await ipfs.add(doc_buffer);
  let ipfs_cid = ipfs_response.cid;
  let doc_id = `0x${crypto.randomBytes(32).toString('hex')}`;

  openSign.addDocument(doc_id, ipfs_cid.bytes, { from: user.wallet_address })
    .then(async (_result) => {
      let document = new Document({
        doc_id: doc_id,
        doc_title: doc_title,
        file_type: file_type,
        file_size: req.file.size,
        ipfs_hash: ipfs_cid,
        uploader_address: user.wallet_address,
        signer_addresses: signers
      });
      await document.save();

      return res.json({
        success: true,
        doc_id: doc_id,
        ipfs_hash: ipfs_cid.path,
        file_type: file_type
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

  let document = await Document.aggregate([
    {
      $match: {
        doc_id: document_id,
        uploader_address: user.wallet_address,
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "signer_addresses",
        foreignField: "wallet_address",
        as: "signers"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "signed_addresses",
        foreignField: "wallet_address",
        as: "signeds"
      }
    }
  ]);

  if (document) {
    document = document[0];
    console.log(document);

    try {
      // const buffers = await pipe(
      //   ipfs.get(document.ipfs_hash),
      //   (source) => all(source)
      // )
      // const the_file = Buffer.concat(buffers).toString('base64url');
      // console.log(the_file);

      
      // let buffer_file = "";
      // for await (const buf of ipfs.get(document.ipfs_hash)) {
      //   buffer_file += buf.toString('base64');
      // }

      const content = [];
      for await (const chunk of ipfs.cat(document.ipfs_hash)) {
          content.push(chunk);
      }
      const file_buffer = Buffer.concat(content).toString("base64");

      return res.json({
        success: true,
        document: {
          title: document.doc_title,
          file_type: document.file_type,
          file_size: document.file_size,
          signeds: document.signeds,
          signers: document.signers,
          file_buffer: `data:${document.file_type};base64,${file_buffer}`,
          is_locked: document.is_locked,
        }
      })

    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Failed to get the requested file from IPFS"
      });
    }

  }
  else {
    return res.json({
      success: false,
      message: "The document you're looking for cannot be found!"
    })
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
        if (arrayEquals(document.signed_addresses, document.signer_addresses)) {
          let lock_status = true;
          document.is_locked = lock_status;
          openSign.lockDocument(document_id, lock_status, { from: user.wallet_address })
            .then(async (_result) => {
              console.log(_result);
            })
            .catch((_error) => {
              console.log(_error);
            });
        }
        document.save();

        return res.json({
          success: true,
          doc_id: document_id,
          sign_lock: document.is_locked
        });
      });
  }
  else {
    res.json({
      success: false,
      message: "The requested document is not available, you have already signed it, or you don't have permission to sign it."
    })
  }
})

router.post('/verify', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
