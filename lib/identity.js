const EthCrypto = require('eth-crypto');

exports.signerIdentity = EthCrypto.createIdentity();
exports.receiverIdentity = EthCrypto.createIdentity();