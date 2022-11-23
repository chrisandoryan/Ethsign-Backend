var express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../database/User');
var ethUtil = require('ethereumjs-util');

var router = express.Router();

router.get('/', async (req, res) => {
  let users = await User.find({});
  return res.json({
    success: true,
    users: users
  });
});


router.post('/wallet/check', async (req, res) => {
  let wallet_address = req.body.wallet_address;
  console.log(wallet_address);

  let user = await User.findOne({ wallet_address: wallet_address })
  if (user) {
    return res.json({
      success: true,
      message: 'User is found',
      exists: true
    });
  }
  else {
    return res.json({
      success: true,
      message: 'User cannot be found',
      exists: false
    });
  }
});

router.post('/register', async (req, res) => {
  let user = await User.exists({ email: req.body.email });
  if (!user) {
    user = new User();
    user.email = req.body.email;
    user.password = req.body.password;
    user.wallet_address = req.body.wallet_address;
  
    await user.save();
    res.json({
      success: true,
      message: 'Signup successful',
      user: {
        id: user.id,
        email: user.email,
        wallet_address: user.wallet_address,
      }
    });
  }
  else {
    res.status(400).json({
      success: false,
      message: 'User already exists! Please login',
    });
  }
  
});

router.post('/wallet/nonce', async (req, res) => {
  let wallet_address = req.body.wallet_address;
  let user = await User.findOne({ wallet_address: wallet_address });

  if (user) {
    return res.json({
      success: true,
      message: 'Nonce is available',
      user: {
        id: user.id,
        email: user.email,
        nonce: user.nonce
      }
    });
  }
  else {
    return res.json({
      success: false,
      message: 'Nonce is not available',
      user: false
    });
  }
});

router.post('/:wallet_address/signature', (req, res) => {
  User.findOne({wallet_address: req.params.wallet_address}, (err, user) => {
      if (err) {
          res.send(err);
      }
      if (user) {
          const msg = `Nonce: ${user.nonce}`;
          // Convert msg to hex string
          const msgHex = ethUtil.bufferToHex(Buffer.from(msg));

          // Check if signature is valid
          const msgBuffer = ethUtil.toBuffer(msgHex);
          const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
          const signatureBuffer = ethUtil.toBuffer(req.body.signature);
          const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
          const publicKey = ethUtil.ecrecover(
              msgHash,
              signatureParams.v,
              signatureParams.r,
              signatureParams.s
          );
          const addressBuffer = ethUtil.publicToAddress(publicKey);
          const address = ethUtil.bufferToHex(addressBuffer);

          // Check if address matches
          if (address.toLowerCase() === user.wallet_address.toLowerCase()) {
              // Change user nonce
              user.nonce = Math.floor(Math.random() * 1000000);
              user.save((err) => {
                  if (err) {
                      res.send(err);
                  }
              });

              // Set jwt token
              const token = jwt.sign({
                  id: user.id,
                  address: user.address
              }, process.env.JWT_SECRET, {expiresIn: '6h'});

              res.json({
                  success: true,
                  token: `Bearer ${token}`,
                  user: {
                    id: user.id,
                    email: user.email,
                    wallet_address: user.wallet_address
                  },
                  message: "You are now logged in."
              });
          } else {
              // User is not authenticated
              res.status(401).send({
                success: false,
                message: 'Invalid credentials'
              });
          }
      } else {
          res.send({
            success: false,
            message: 'User does not exist'
          });
      }
  });
});

module.exports = router;
