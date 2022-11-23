const Web3 = require('web3');
const ganache = require('ganache-cli');

// create a web3-instance
const web3 = new Web3('http://'); // set 'http://' because web3 needs a provider
web3.transactionConfirmationBlocks = 1; // set confirmations-blocks to 1 for fast testing

// create a ganache-provider
const ganacheProvider = ganache.provider({
    accounts: [
        // we preset the balance of our creatorIdentity to 10 ether
        {
            secretKey: creatorIdentity.privateKey,
            balance: web3.utils.toWei('10', 'ether')
        },
        // we also give some wei to the recieverIdentity
        // so it can send transaction to the chain
        {
            secretKey: recieverIdentity.privateKey,
            balance: web3.utils.toWei('1', 'ether')
        }
    ]
});

// set ganache to web3 as provider
web3.setProvider(ganacheProvider);

exports.web3 = web3;