var express = require('express');
var router = express.Router();

// Get user nonce
router.get('/:wallet_address/nonce', (req, res) => {
  // Check if user exists
  // ... search in database for user and returns its current nonce
});

// Process signed message
router.post('/:user/signature', (req, res) => {
  // Get user from db
  User.findOne({wallet_address: req.params.user}, (err, user) => {
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
