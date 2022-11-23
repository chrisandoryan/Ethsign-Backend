const { receiverIdentity } = require("../lib/identity");

const openSign = artifacts.require("../../contracts/OpenSign.sol");  
module.exports = function (deployer) {   
   deployer.deploy(openSign, receiverIdentity.address); 
};