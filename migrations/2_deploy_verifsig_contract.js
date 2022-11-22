const { receiverIdentity } = require("../lib/identity");

const VerifySig = artifacts.require("../../contracts/VerifySig.sol");  
module.exports = function (deployer) {   
   deployer.deploy(VerifySig, receiverIdentity.address); 
};