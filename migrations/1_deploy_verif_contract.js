const { signerIdentity } = require("../lib/identity");

const Verify = artifacts.require("../../contracts/Verify.sol");  
module.exports = function (deployer) {   
   deployer.deploy(Verify, signerIdentity.address); 
};