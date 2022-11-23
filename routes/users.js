var express = require('express');
const passport = require('passport');
const User = require('../database/User');


var router = express.Router();

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
      success: false,
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
  // Check if user exists
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
      message: 'Nonce cannot be found',
      user: false
    });
  }
});

// Process signed message
router.post('/:wallet_address/signature', (req, res) => {
  // Get user from db
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
          const addresBuffer = ethUtil.publicToAddress(publicKey);
          const address = ethUtil.bufferToHex(addresBuffer);

          // Check if address matches
          if (address.toLowerCase() === req.params.user.toLowerCase()) {
              // Change user nonce
              user.nonce = Math.floor(Math.random() * 1000000);
              user.save((err) => {
                  if (err) {
                      res.send(err);
                  }
              });
              // Set jwt token
              const token = jwt.sign({
                  _id: user._id,
                  address: user.address
              }, process.env.JWT_SECRET, {expiresIn: '6h'});
              res.json({
                  success: true,
                  token: `Bearer ${token}`,
                  user: user,
                  msg: "You are now logged in."
              });
          } else {
              // User is not authenticated
              res.status(401).send('Invalid credentials');
          }
      } else {
          res.send('User does not exist');
      }
  });
});

module.exports = router;
