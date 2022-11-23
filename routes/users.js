var express = require('express');
const passport = require('passport');
const User = require('../database/User');


var router = express.Router();

router.get('/:wallet_address', async (req, res) => {
  let user = await User.findOne({ wallet_address: req.params.wallet_address })
  if (user) {
    return res.status(200).json({
      message: 'User is found',
      data: true
    });
  }
  else {
    return res.status(404).json({
      message: 'User cannot be found',
      data: false
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
    res.status(200).json({
      message: 'Signup successful',
      data: {
        id: user.id,
        email: user.email,
        wallet_address: user.wallet_address,
      }
    });
  }
  else {
    res.status(400).json({
      message: 'User already exists! Please login',
    });
  }
  
});

router.get('/:wallet_address/nonce', async (req, res) => {
  // Check if user exists
  let user = await User.findOne({ wallet_address: req.params.wallet_address });
  if (user) {
    return res.status(200).json({
      message: 'Nonce is available',
      data: {
        id: user.id,
        email: user.email,
        nonce: user.nonce
      }
    });
  }
  else {
    return res.status(404).json({
      message: 'Nonce cannot be found',
      data: false
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
              res.status(200).json({
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
